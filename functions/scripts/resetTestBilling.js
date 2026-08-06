'use strict';

/**
 * Clears test-mode Stripe IDs and demotes Plus so live billing starts clean.
 *
 * Usage from functions/:
 *   node scripts/resetTestBilling.js
 *
 * Requires Application Default Credentials for grocerylister-b107b
 * (e.g. gcloud auth application-default login, or a service account).
 */

const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const PROJECT_ID = 'grocerylister-b107b';

async function main() {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }

  const db = getFirestore();
  const profiles = await db.collectionGroup('profiles').get();
  let updated = 0;

  for (const doc of profiles.docs) {
    const data = doc.data() || {};
    const hasBilling =
      data.stripeCustomerId ||
      data.stripeSubscriptionId ||
      data.aiImportPlan === 'plus' ||
      data.aiImportPlan === 'pro' ||
      data.aiImportLimit === null;

    if (!hasBilling) continue;

    await doc.ref.set(
      {
        aiImportPlan: 'free',
        aiImportLimit: 10,
        stripeCustomerId: FieldValue.delete(),
        stripeSubscriptionId: FieldValue.delete(),
        aiImportUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    updated += 1;
    console.log(`Reset ${doc.ref.path}`);
  }

  const customers = await db.collection('stripeCustomers').get();
  for (const doc of customers.docs) {
    await doc.ref.delete();
    console.log(`Deleted stripeCustomers/${doc.id}`);
  }

  console.log(`\nDone. Profiles reset: ${updated}. stripeCustomers cleared: ${customers.size}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
