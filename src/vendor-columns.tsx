/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from '@haderach/shared-ui';
import { Button, FilterableHeader, setFilterFn } from '@haderach/shared-ui';
import { ArrowUpDown } from 'lucide-react';
import type { VendorInfo } from './types';

function SortableHeader({ column, label }: { column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' }; label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs font-medium"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown />
    </Button>
  );
}

type ColumnType = 'categorical' | 'boolean' | 'date' | 'numeric' | 'text';

export const COLUMN_META: Record<string, { label: string; colType: ColumnType }> = {
  accountType:          { label: 'Account type',              colType: 'categorical' },
  autoRenew:            { label: 'Auto-renew',                colType: 'boolean' },
  billingFrequency:     { label: 'Billing frequency',         colType: 'categorical' },
  contractStartDate:    { label: 'Contract start',            colType: 'date' },
  contractEndDate:      { label: 'Contract end',              colType: 'date' },
  contractLengthMonths: { label: 'Contract length (months)',  colType: 'numeric' },
  created_at:           { label: 'Created',                   colType: 'date' },
  department:           { label: 'Department',                colType: 'categorical' },
  lastSyncedAt:         { label: 'Last synced',               colType: 'date' },
  modified_at:          { label: 'Modified',                  colType: 'date' },
  owner:                { label: 'Owner',                     colType: 'categorical' },
  paymentMethod:        { label: 'Payment method',            colType: 'categorical' },
  purpose:              { label: 'Purpose',                   colType: 'categorical' },
  renewalNoticeDays:    { label: 'Renewal notice (days)',     colType: 'numeric' },
  renewalRate:          { label: 'Renewal rate',              colType: 'categorical' },
  secondaryOwner:       { label: 'Secondary owner',           colType: 'categorical' },
  sourceSystem:         { label: 'Source system',             colType: 'categorical' },
  sourceSystemId:       { label: 'Source system ID',          colType: 'text' },
  spendType:            { label: 'Spend type',                colType: 'categorical' },
  terminationTerms:     { label: 'Termination terms',         colType: 'text' },
  track1099:            { label: '1099 tracked',              colType: 'boolean' },
};

function buildColumnDef(
  key: string,
  meta: { label: string; colType: ColumnType },
): (onVendorClick: (v: VendorInfo) => void) => ColumnDef<VendorInfo> {
  if (meta.colType === 'categorical' || meta.colType === 'boolean') {
    return () => ({
      accessorKey: key,
      header: ({ column }) => <FilterableHeader column={column} label={meta.label} />,
      filterFn: setFilterFn,
      cell: ({ row }) => {
        const val = row.getValue(key);
        if (val === true) return 'Yes';
        if (val === false) return 'No';
        return (val as string) ?? '—';
      },
    });
  }

  return () => ({
    accessorKey: key,
    header: ({ column }) => <SortableHeader column={column} label={meta.label} />,
    cell: ({ row }) => (row.getValue(key) as string) ?? '—',
  });
}

export const COLUMN_REGISTRY: Record<
  string,
  (onVendorClick: (v: VendorInfo) => void) => ColumnDef<VendorInfo>
> = Object.fromEntries(
  Object.entries(COLUMN_META).map(([key, meta]) => [key, buildColumnDef(key, meta)]),
);

export const DEFAULT_COLUMNS = ['accountType', 'department', 'owner'];

export function buildVendorColumns(
  onVendorClick: (vendor: VendorInfo) => void,
  visibleKeys?: string[],
): ColumnDef<VendorInfo>[] {
  const nameCol: ColumnDef<VendorInfo> = {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} label="Vendor" />,
    cell: ({ row }) => (
      <button
        type="button"
        className="block w-full truncate font-medium text-primary hover:underline text-left"
        onClick={() => onVendorClick(row.original)}
      >
        {row.getValue('name')}
      </button>
    ),
  };

  const keys = visibleKeys ?? DEFAULT_COLUMNS;
  const dataCols = keys
    .filter((k) => k in COLUMN_REGISTRY)
    .map((k) => COLUMN_REGISTRY[k](onVendorClick));

  return [nameCol, ...dataCols];
}
