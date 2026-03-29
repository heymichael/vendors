import type { ColumnDef } from '@haderach/shared-ui';

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

function formatMonthHeader(month: string): string {
  const [y, m] = month.split('-');
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export type PivotRow = Record<string, string | number>;

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
      return val ? currencyFmt.format(val) : '—';
    },
  }));

  return [vendorCol, ...monthCols];
}
