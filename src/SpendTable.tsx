import { useMemo } from 'react';
import { DataTable } from '@haderach/shared-ui';
import { buildSpendColumns } from './spend-columns';
import type { PivotRow } from './spend-columns';
import type { SpendRow } from './types';

interface SpendTableProps {
  rows: SpendRow[];
}

export function SpendTable({ rows }: SpendTableProps) {
  const { pivotData, columns } = useMemo(() => {
    const monthSet = new Set<string>();
    const vendorMap = new Map<string, Record<string, number>>();

    for (const row of rows) {
      monthSet.add(row.month);
      const existing = vendorMap.get(row.vendor) ?? {};
      existing[row.month] = (existing[row.month] ?? 0) + row.amount;
      vendorMap.set(row.vendor, existing);
    }

    const sortedMonths = [...monthSet].sort();

    const pivotData: PivotRow[] = [...vendorMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([vendor, monthAmounts]) => {
        const row: PivotRow = { vendor };
        for (const month of sortedMonths) {
          row[month] = monthAmounts[month] ?? 0;
        }
        return row;
      });

    const columns = buildSpendColumns(sortedMonths);

    return { pivotData, columns };
  }, [rows]);

  if (rows.length === 0) return null;

  return <DataTable columns={columns} data={pivotData} />;
}
