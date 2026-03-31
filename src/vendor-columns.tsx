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

export function buildVendorColumns(onVendorClick: (vendor: VendorInfo) => void): ColumnDef<VendorInfo>[] {
  return [
    {
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
    },
    {
      accessorKey: 'accountType',
      header: ({ column }) => <FilterableHeader column={column} label="Account Type" />,
      filterFn: setFilterFn,
      cell: ({ row }) => row.getValue('accountType') ?? '—',
    },
    {
      accessorKey: 'department',
      header: ({ column }) => <FilterableHeader column={column} label="Department" />,
      filterFn: setFilterFn,
      cell: ({ row }) => row.getValue('department') ?? '—',
    },
    {
      accessorKey: 'owner',
      header: ({ column }) => <FilterableHeader column={column} label="Owner" />,
      filterFn: setFilterFn,
      cell: ({ row }) => row.getValue('owner') ?? '—',
    },
  ];
}
