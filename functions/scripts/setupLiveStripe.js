'use strict';

/**
 * One-shot live Stripe setup helper.
 *
 * Usage (PowerShell):
 *   $env:STRIPE_SECRET_KEY="sk_live_..."
 *   node scripts/setupLiveStripe.js
 *
 * Creates (or reuses) GroceryLister Plus at $4.99/mo and a live webhook endpoint.
 * Prints STRIPE_PRICE_ID and webhook signing secret to set in Firebase.
 */

const Stripe = require('stripe');

const WEBHOOK_URL =
  'https://us-central1-grocerylister-b107b.cloudfunctions.net/stripeWebhook';
const PRODUCT_NAME = 'GroceryLister Plus';
const PRICE_CENTS = 499;
const PRICE_LOOKUP = 'grocerylister_plus_monthly';

async function main() {
  const key = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key.startsWith('sk_live_') && !key.startsWith('rk_live_')) {
    console.error('Set STRIPE_SECRET_KEY to a live secret (sk_live_… or rk_live_…).');
    process.exit(1);
  }

  const stripe = new Stripe(key, { apiVersion: '2026-06-24.dahlia' });
  const account = await stripe.accounts.retrieve();
  console.log(`Stripe account: ${account.id} (${account.business_profile?.name || 'no name'})`);
  console.log(`Charges enabled: ${account.charges_enabled}, payouts: ${account.payouts_enabled}`);

  let product = (
    await stripe.products.search({
      query: `name:'${PRODUCT_NAME}' AND active:'true'`,
      limit: 1,
    })
  ).data[0];

  if (!product) {
    product = await stripe.products.create({
      name: PRODUCT_NAME,
      description: 'Unlimited shared AI recipe imports',
      metadata: { app: 'grocerylister', feature: 'ai_import_pro' },
    });
    console.log(`Created product ${product.id}`);
  } else {
    console.log(`Reusing product ${product.id}`);
  }

  let price =
    (
      await stripe.prices.list({
        product: product.id,
        active: true,
        type: 'recurring',
        limit: 20,
      })
    ).data.find(
      (p) =>
        p.unit_amount === PRICE_CENTS &&
        p.currency === 'usd' &&
        p.recurring?.interval === 'month'
    ) || null;

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: PRICE_CENTS,
      currency: 'usd',
      recurring: { interval: 'month' },
      lookup_key: PRICE_LOOKUP,
      transfer_lookup_key: true,
      nickname: 'Plus monthly',
      metadata: { app: 'grocerylister' },
    });
    console.log(`Created price ${price.id}`);
  } else {
    console.log(`Reusing price ${price.id}`);
  }

  const existingHooks = await stripe.webhookEndpoints.list({ limit: 100 });
  let hook = existingHooks.data.find((h) => h.url === WEBHOOK_URL);

  let webhookSecret = null;
  if (!hook) {
    hook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
      ],
      description: 'GroceryLister AI Import Plus',
      metadata: { app: 'grocerylister' },
    });
    webhookSecret = hook.secret;
    console.log(`Created webhook endpoint ${hook.id}`);
  } else {
    console.log(`Webhook already exists: ${hook.id}`);
    console.log(
      'If you need the signing secret again, reveal it in Stripe Dashboard → Developers → Webhooks → this endpoint.'
    );
  }

  console.log('\n=== Put these into Firebase ===\n');
  console.log(`functions/.env  →  STRIPE_PRICE_ID=${price.id}`);
  console.log(`functions/.env  →  APP_PUBLIC_URL=https://web.grocerylisterapp.com`);
  console.log('firebase functions:secrets:set STRIPE_SECRET_KEY   # paste sk_live_…');
  if (webhookSecret) {
    console.log(`firebase functions:secrets:set STRIPE_WEBHOOK_SECRET  # ${webhookSecret}`);
  } else {
    console.log('firebase functions:secrets:set STRIPE_WEBHOOK_SECRET  # paste live whsec_…');
  }
  console.log('\nAlso in Stripe Dashboard (Live mode):');
  console.log('  Settings → Billing → Customer portal → enable cancel + update payment method');
  console.log('  Complete business / payouts / tax prompts if any remain\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
