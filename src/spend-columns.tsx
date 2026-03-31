import type { ColumnDef, PivotRow } from '@haderach/shared-ui';
import { formatCurrency, formatMonthHeader } from '@haderach/shared-ui';

export type { PivotRow };

export function buildSpendColumns(months: string[]): ColumnDef<PivotRow>[] {
  const vendorCol: ColumnDef<PivotRow> = {
    accessorKey: 'vendor',
    header: () => <span className="font-bold text-sm">Vendor</span>,
    cell: ({ row }) => {
      const name = row.getValue('vendor') as string;
      return (
        <span className="block truncate" title={name}>
          {name}
        </span>
      );
    },
    size: 220,
    minSize: 120,
  };

  const monthCols: ColumnDef<PivotRow>[] = months.map((month) => ({
    accessorKey: month,
    header: () => (
      <span className="font-bold text-sm">{formatMonthHeader(month)}</span>
    ),
    cell: ({ row }) => {
      const val = row.getValue(month) as number;
      return val ? formatCurrency(val) : '—';
    },
  }));

  return [vendorCol, ...monthCols];
}
