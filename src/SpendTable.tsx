import { useMemo } from 'react';
import { DataTable, pivotLongToWide } from '@haderach/shared-ui';
import { buildSpendColumns } from './spend-columns';
import type { SpendRow } from './types';

interface SpendTableProps {
  rows: SpendRow[];
}

export function SpendTable({ rows }: SpendTableProps) {
  const { pivotData, columns } = useMemo(() => {
    const inputs = rows.map((r) => ({ rowKey: r.vendor, columnKey: r.month, value: r.amount }));
    const { data, columnKeys } = pivotLongToWide(inputs, 'vendor');
    return { pivotData: data, columns: buildSpendColumns(columnKeys) };
  }, [rows]);

  if (rows.length === 0) return null;

  return <DataTable columns={columns} data={pivotData} />;
}
