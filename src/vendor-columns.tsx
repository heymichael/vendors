/* eslint-disable react-refresh/only-export-components */
import type { ColumnDef } from '@haderach/shared-ui';
import { Button } from '@haderach/shared-ui';
import { ArrowUpDown } from 'lucide-react';
import type { VendorInfo } from './types';

function SortableHeader({ column, label }: { column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' }; label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="font-bold"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown />
    </Button>
  );
}

export function buildVendorColumns(onVendorClick: (vendor: VendorInfo) => void): ColumnDef<VendorInfo>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label="Vendor" />,
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
      accessorKey: 'accountType',
      header: ({ column }) => <SortableHeader column={column} label="Account Type" />,
      cell: ({ row }) => row.getValue('accountType') ?? '—',
    },
    {
      accessorKey: 'department',
      header: ({ column }) => <SortableHeader column={column} label="Department" />,
      cell: ({ row }) => row.getValue('department') ?? '—',
    },
    {
      accessorKey: 'owner',
      header: ({ column }) => <SortableHeader column={column} label="Owner" />,
      cell: ({ row }) => row.getValue('owner') ?? '—',
    },
    {
      accessorKey: 'hide',
      header: () => <span className="font-bold text-sm">Hidden</span>,
      cell: ({ row }) => {
        const hidden = row.getValue('hide') as boolean | undefined;
        return hidden ? (
          <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Yes</span>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        );
      },
    },
  ];
}
