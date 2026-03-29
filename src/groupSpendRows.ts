import type { SpendRow } from './types';

export const OTHER_VENDOR = 'Other';
const MAX_VENDORS = 30;

/**
 * Aggregates spend rows so that only the top N vendors by total spend are
 * shown individually; the rest are collapsed into an "Other" bucket.
 * Returns the original rows untouched when the vendor count is within the limit.
 */
export function groupSpendRows(rows: SpendRow[], maxVendors = MAX_VENDORS): SpendRow[] {
  const totalByVendor = new Map<string, number>();
  for (const r of rows) {
    totalByVendor.set(r.vendor, (totalByVendor.get(r.vendor) ?? 0) + r.amount);
  }

  if (totalByVendor.size <= maxVendors) return rows;

  const ranked = [...totalByVendor.entries()]
    .sort((a, b) => b[1] - a[1]);

  const topVendors = new Set(ranked.slice(0, maxVendors).map(([v]) => v));

  const otherByMonth = new Map<string, number>();
  const kept: SpendRow[] = [];

  for (const r of rows) {
    if (topVendors.has(r.vendor)) {
      kept.push(r);
    } else {
      otherByMonth.set(r.month, (otherByMonth.get(r.month) ?? 0) + r.amount);
    }
  }

  for (const [month, amount] of otherByMonth) {
    kept.push({ vendor: OTHER_VENDOR, vendorId: OTHER_VENDOR, month, amount });
  }

  return kept;
}
