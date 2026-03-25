import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { getOrInitFirebaseApp, ensureAuth } from './firebase';
import type { SpendRow, VendorInfo } from './types';

function toMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/**
 * Query the Firestore `vendor_spend` collection for the selected vendors
 * within the given date range. Returns rows shaped for SpendChart/SpendTable.
 */
export async function fetchVendorSpend(
  selectedIds: string[],
  vendors: VendorInfo[],
  dateFrom: string,
  dateTo: string,
): Promise<SpendRow[]> {
  const app = getOrInitFirebaseApp();
  if (!app) throw new Error('Firebase not initialized');

  await ensureAuth(app);
  const db = getFirestore(app);

  const spendKeySet = new Set<string>();
  for (const id of selectedIds) {
    const v = vendors.find((v) => v.id === id);
    spendKeySet.add(v?.billcomId || id);
  }

  const startMonth = toMonth(dateFrom);
  const endMonth = toMonth(dateTo);

  const q = query(
    collection(db, 'vendor_spend'),
    where('month', '>=', startMonth),
    where('month', '<=', endMonth),
  );

  const snapshot = await getDocs(q);

  const rows: SpendRow[] = [];
  for (const doc of snapshot.docs) {
    const d = doc.data();
    if (d.hide === true) continue;
    if (!spendKeySet.has(d.vendorId)) continue;

    rows.push({
      vendor: d.vendorName ?? d.vendorId,
      month: d.month,
      amount: typeof d.totalAmount === 'number' ? d.totalAmount : parseFloat(d.totalAmount) || 0,
    });
  }

  return rows;
}
