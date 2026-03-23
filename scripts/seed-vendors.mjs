#!/usr/bin/env node

/**
 * One-time seed script: writes the five initial vendors to the Firestore
 * `vendors` collection. Uses Application Default Credentials — run
 * `gcloud auth application-default login` first if running locally.
 *
 * Usage:
 *   node scripts/seed-vendors.mjs                           # dry-run (prints docs)
 *   node scripts/seed-vendors.mjs --project <project-id>    # writes to Firestore
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const VENDORS = [
  {
    id: 'aws',
    name: 'Amazon Web Services',
    category: 'Cloud Infrastructure',
    status: 'active',
    billingCycle: 'monthly',
    paymentMethod: 'invoice',
    contractRenews: '2026-06-15',
    accountId: '',
    billingContact: '',
    internalContact: '',
    dataSource: 'Cost Explorer API',
    vendorContact: '',
    supportPhone: '',
    supportEmail: '',
    billingAddress: '',
    website: 'https://aws.amazon.com',
    loginUrl: 'https://console.aws.amazon.com',
    notes: '',
  },
  {
    id: 'gcs',
    name: 'Google Cloud Platform',
    category: 'Cloud Infrastructure',
    status: 'active',
    billingCycle: 'monthly',
    paymentMethod: 'invoice',
    contractRenews: '2026-12-01',
    accountId: '',
    billingContact: '',
    internalContact: '',
    dataSource: '',
    vendorContact: '',
    supportPhone: '',
    supportEmail: '',
    billingAddress: '',
    website: 'https://cloud.google.com',
    loginUrl: 'https://console.cloud.google.com',
    notes: '',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    category: 'DevTools',
    status: 'active',
    billingCycle: 'monthly',
    paymentMethod: 'credit-card',
    accountId: '',
    billingContact: '',
    internalContact: '',
    dataSource: '',
    vendorContact: '',
    supportPhone: '',
    supportEmail: '',
    billingAddress: '',
    website: 'https://cursor.com',
    loginUrl: 'https://cursor.com/settings',
    notes: '',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'Advertising',
    status: 'active',
    billingCycle: 'monthly',
    paymentMethod: 'credit-card',
    accountId: '',
    billingContact: '',
    internalContact: '',
    dataSource: '',
    vendorContact: '',
    supportPhone: '',
    supportEmail: '',
    billingAddress: '',
    website: 'https://business.facebook.com',
    loginUrl: 'https://business.facebook.com',
    notes: '',
  },
  {
    id: 'rhonda-bender',
    name: 'Rhonda Bender',
    category: 'Consulting',
    status: 'active',
    billingCycle: 'monthly',
    paymentMethod: 'invoice',
    accountId: '',
    billingContact: '',
    internalContact: '',
    dataSource: '',
    vendorContact: '',
    supportPhone: '',
    supportEmail: '',
    billingAddress: '',
    notes: '',
  },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--project');
  if (idx === -1 || !args[idx + 1]) return null;
  return args[idx + 1];
}

async function main() {
  const projectId = parseArgs();

  if (!projectId) {
    console.log('Dry-run mode (pass --project <id> to write to Firestore)\n');
    for (const v of VENDORS) {
      console.log(`  vendors/${v.id}`, JSON.stringify(v, null, 2));
    }
    return;
  }

  initializeApp({ credential: applicationDefault(), projectId });
  const db = getFirestore();

  const batch = db.batch();
  for (const vendor of VENDORS) {
    batch.set(db.collection('vendors').doc(vendor.id), vendor);
  }
  await batch.commit();

  console.log(`Seeded ${VENDORS.length} vendors into project "${projectId}".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
