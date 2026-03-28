import { agentFetch } from '@haderach/shared-ui';
import type { SpendRow } from './types';

function toMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export async function fetchVendorSpend(
  selectedIds: string[],
  dateFrom: string,
  dateTo: string,
  getIdToken: () => Promise<string>,
): Promise<SpendRow[]> {
  const startMonth = toMonth(dateFrom);
  const endMonth = toMonth(dateTo);

  const params = new URLSearchParams();
  for (const id of selectedIds) {
    params.append('vendor_ids', id);
  }
  params.set('from', startMonth);
  params.set('to', endMonth);

  const res = await agentFetch(`/spend?${params.toString()}`, getIdToken);
  if (!res.ok) throw new Error(`Failed to fetch spend data: ${res.status}`);

  const body = await res.json();
  return body.data as SpendRow[];
}
