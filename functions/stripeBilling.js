'use strict';

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Stripe = require('stripe');
const { profilePath } = require('./aiImportQuota');

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const stripePriceId = defineString('STRIPE_PRICE_ID', { default: '' });
const stripeRequireLive = defineString('STRIPE_REQUIRE_LIVE', { default: 'true' });
const appPublicUrl = defineString('APP_PUBLIC_URL', {
  default: 'https://web.grocerylisterapp.com',
});

function getStripe() {
  const raw = String(stripeSecretKey.value() || '').trim();
  // Strip accidental quotes from Secret Manager pastes
  const key = raw.replace(/^["']|["']$/g, '').trim();
  if (!key) {
    throw new HttpsError('failed-precondition', 'STRIPE_SECRET_KEY is empty.');
  }
  const prefix = key.slice(0, 8);
  if (!prefix.startsWith('sk_') && !prefix.startsWith('rk_')) {
    logger.error('STRIPE_SECRET_KEY has unexpected prefix', { prefix });
    throw new HttpsError(
      'failed-precondition',
      'Stripe secret looks malformed. Re-add STRIPE_SECRET_KEY (sk_live_…) in Secret Manager and redeploy.'
    );
  }
  return new Stripe(key, {
    apiVersion: '2026-06-24.dahlia',
  });
}

function assertLiveStripeConfigured() {
  if (String(stripeRequireLive.value() || 'true').toLowerCase() === 'false') {
    return;
  }
  const key = String(stripeSecretKey.value() || '')
    .trim()
    .replace(/^["']|["']$/g, '');
  if (key.includes('_test_')) {
    throw new HttpsError(
      'failed-precondition',
      'Plus upgrades are finishing setup. Free AI imports still work — try Upgrade again shortly.'
    );
  }
  if (!key.startsWith('sk_live_') && !key.startsWith('rk_live_')) {
    throw new HttpsError(
      'failed-precondition',
      'Stripe secret must be a live key (sk_live_…). Update STRIPE_SECRET_KEY and redeploy.'
    );
  }
}

function assertSignedIn(auth) {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in to manage billing.');
  }
}

async function getProfileSnap(uid) {
  const db = getFirestore();
  return db.doc(profilePath(uid)).get();
}

async function ensureStripeCustomer({ uid, email, displayName }) {
  const db = getFirestore();
  const ref = db.doc(profilePath(uid));
  const snap = await ref.get();
  const existing = snap.exists ? snap.data()?.stripeCustomerId : null;
  const stripe = getStripe();

  if (existing) {
    try {
      const customer = await stripe.customers.retrieve(existing);
      if (customer && !customer.deleted) {
        return existing;
      }
      logger.warn('Stored Stripe customer missing or deleted; recreating', {
        uid,
        customerId: existing,
      });
    } catch (error) {
      // Common after switching test → live keys: cus_… from the other mode.
      logger.warn('Stored Stripe customer invalid for current mode; recreating', {
        uid,
        customerId: existing,
        message: error?.message || String(error),
      });
    }
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    name: displayName || undefined,
    metadata: { firebaseUid: uid },
  });

  await ref.set(
    {
      stripeCustomerId: customer.id,
      uid,
      email: email || null,
    },
    { merge: true }
  );

  await db.doc(`stripeCustomers/${customer.id}`).set(
    {
      uid,
      email: email || null,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return customer.id;
}

async function setPlusPlan(uid, { customerId, subscriptionId }) {
  const db = getFirestore();
  await db.doc(profilePath(uid)).set(
    {
      aiImportPlan: 'plus',
      aiImportLimit: null,
      aiImportUpdatedAt: FieldValue.serverTimestamp(),
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    },
    { merge: true }
  );
}

async function setFreePlan(uid, { subscriptionId = null } = {}) {
  const db = getFirestore();
  await db.doc(profilePath(uid)).set(
    {
      aiImportPlan: 'free',
      aiImportLimit: 10,
      aiImportUpdatedAt: FieldValue.serverTimestamp(),
      stripeSubscriptionId: subscriptionId,
    },
    { merge: true }
  );
}

async function resolveUidFromCustomer(customerId) {
  if (!customerId) return null;

  const db = getFirestore();
  const mapSnap = await db.doc(`stripeCustomers/${customerId}`).get();
  if (mapSnap.exists && mapSnap.data()?.uid) {
    return mapSnap.data().uid;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId);
  if (customer && !customer.deleted && customer.metadata?.firebaseUid) {
    return customer.metadata.firebaseUid;
  }

  return null;
}

function mapStripeError(error, fallbackMessage) {
  const message = String(error?.message || fallbackMessage);
  const type = String(error?.type || '');
  const code = String(error?.code || '');
  logger.error('Stripe API error', {
    type,
    code,
    message,
    statusCode: error?.statusCode || null,
  });

  if (
    /No such price|No such customer|resource_missing/i.test(message) ||
    code === 'resource_missing'
  ) {
    return new HttpsError(
      'failed-precondition',
      'Billing is misconfigured (price/customer). Check the live Stripe price and try Upgrade again.'
    );
  }
  if (/Invalid API Key|api_key|authentication/i.test(message) || type === 'StripeAuthenticationError') {
    return new HttpsError(
      'failed-precondition',
      'Stripe live key is invalid. Update STRIPE_SECRET_KEY and redeploy.'
    );
  }
  if (type === 'StripeInvalidRequestError') {
    return new HttpsError(
      'failed-precondition',
      message.length < 160 ? message : 'Stripe rejected the checkout request. Try again shortly.'
    );
  }
  return new HttpsError('internal', fallbackMessage);
}

const createAiImportCheckoutSession = onCall(
  {
    secrets: [stripeSecretKey],
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (request) => {
    assertSignedIn(request.auth);
    assertLiveStripeConfigured();
    const email = request.auth.token?.email;

    const priceId = String(stripePriceId.value() || '').trim();
    if (!priceId) {
      throw new HttpsError(
        'failed-precondition',
        'Stripe price is not configured yet (STRIPE_PRICE_ID).'
      );
    }

    try {
      const customerId = await ensureStripeCustomer({
        uid: request.auth.uid,
        email,
        displayName: request.auth.token?.name,
      });

      const baseUrl = String(appPublicUrl.value() || 'https://web.grocerylisterapp.com').replace(
        /\/$/,
        ''
      );
      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        client_reference_id: request.auth.uid,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/account?billing=success`,
        cancel_url: `${baseUrl}/account?billing=cancel`,
        allow_promotion_codes: true,
        metadata: { firebaseUid: request.auth.uid },
        subscription_data: {
          metadata: { firebaseUid: request.auth.uid },
        },
      });

      if (!session.url) {
        throw new HttpsError('internal', 'Could not start Checkout. Try again.');
      }

      return { url: session.url };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw mapStripeError(error, 'Could not start Checkout. Try again.');
    }
  }
);

const createBillingPortalSession = onCall(
  {
    secrets: [stripeSecretKey],
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (request) => {
    assertSignedIn(request.auth);
    const snap = await getProfileSnap(request.auth.uid);
    let customerId = snap.exists ? snap.data()?.stripeCustomerId : null;
    if (!customerId) {
      throw new HttpsError('failed-precondition', 'No billing account yet. Upgrade first.');
    }

    const stripe = getStripe();
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer || customer.deleted) {
        throw new Error('deleted');
      }
    } catch (error) {
      logger.warn('Portal customer invalid for current Stripe mode', {
        uid: request.auth.uid,
        customerId,
        message: error?.message || String(error),
      });
      throw new HttpsError(
        'failed-precondition',
        'Billing account needs to be refreshed. Start Upgrade once, then try Manage billing again.'
      );
    }

    const baseUrl = String(appPublicUrl.value() || 'https://web.grocerylisterapp.com').replace(
      /\/$/,
      ''
    );
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/account`,
    });

    return { url: session.url };
  }
);

const stripeWebhook = onRequest(
  {
    secrets: [stripeSecretKey, stripeWebhookSecret],
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const stripe = getStripe();
    const signature = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret.value()
      );
    } catch (error) {
      logger.error('Stripe webhook signature verification failed', {
        message: error?.message || String(error),
      });
      res.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          if (session.mode !== 'subscription') break;
          const uid =
            session.metadata?.firebaseUid ||
            session.client_reference_id ||
            (await resolveUidFromCustomer(session.customer));
          if (!uid) {
            logger.error('checkout.session.completed missing firebaseUid', {
              sessionId: session.id,
            });
            break;
          }
          await setPlusPlan(uid, {
            customerId: session.customer,
            subscriptionId: session.subscription,
          });
          logger.info('Marked user plus after checkout', { uid });
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const uid =
            subscription.metadata?.firebaseUid ||
            (await resolveUidFromCustomer(subscription.customer));
          if (!uid) {
            logger.error('subscription event missing firebaseUid', {
              subscriptionId: subscription.id,
              type: event.type,
            });
            break;
          }
          // Keep Plus through renewals and Stripe payment retries (past_due).
          // Revoke on cancel/delete/unpaid — cancel_at_period_end stays "active" until end.
          const active =
            event.type !== 'customer.subscription.deleted' &&
            ['active', 'trialing', 'past_due'].includes(subscription.status);
          if (active) {
            await setPlusPlan(uid, {
              customerId: subscription.customer,
              subscriptionId: subscription.id,
            });
          } else {
            await setFreePlan(uid, { subscriptionId: subscription.id });
          }
          logger.info('Updated plan from subscription event', {
            uid,
            status: subscription.status,
            active,
          });
          break;
        }
        default:
          break;
      }
      res.json({ received: true });
    } catch (error) {
      logger.error('Stripe webhook handler failed', {
        type: event.type,
        message: error?.message || String(error),
      });
      res.status(500).send('Webhook handler failed');
    }
  }
);

module.exports = {
  createAiImportCheckoutSession,
  createBillingPortalSession,
  stripeWebhook,
};
