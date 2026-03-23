import type { ColumnDef } from '@haderach/shared-ui';
import { Button } from '@haderach/shared-ui';
import { ArrowUpDown } from 'lucide-react';
import type { VendorInfo, VendorStatus } from './types';

const statusLabels: Record<VendorStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  trial: 'Trial',
};

const statusColors: Record<VendorStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-gray-100 text-gray-600',
  trial: 'bg-amber-100 text-amber-800',
};

const paymentLabels: Record<string, string> = {
  'credit-card': 'Credit Card',
  'credit_card': 'Credit Card',
  invoice: 'Invoice',
  ach: 'ACH',
  wire: 'Wire',
};

const cycleLabels: Record<string, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
  'usage-based': 'Usage-based',
};

export function buildVendorColumns(onVendorClick: (vendor: VendorInfo) => void): ColumnDef<VendorInfo>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="font-bold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Vendor
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline text-left"
          onClick={() => onVendorClick(row.original)}
        >
          {row.getValue('name')}
        </button>
      ),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="font-bold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Category
          <ArrowUpDown />
        </Button>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <span className="font-bold text-sm">Status</span>,
      cell: ({ row }) => {
        const status = row.getValue('status') as VendorStatus;
        return (
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        );
      },
    },
    {
      accessorKey: 'billingCycle',
      header: () => <span className="font-bold text-sm">Billing Cycle</span>,
      cell: ({ row }) => cycleLabels[row.getValue('billingCycle') as string] ?? row.getValue('billingCycle'),
    },
    {
      accessorKey: 'paymentMethod',
      header: () => <span className="font-bold text-sm">Payment Method</span>,
      cell: ({ row }) => paymentLabels[row.getValue('paymentMethod') as string] ?? row.getValue('paymentMethod'),
    },
  ];
}
