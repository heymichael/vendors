import { useState, useMemo, useEffect } from 'react';
import { DataTable, Button } from '@haderach/shared-ui';
import type { ColumnFiltersState, OnChangeFn, VisibilityState } from '@haderach/shared-ui';
import { X } from 'lucide-react';
import { buildVendorColumns, COLUMN_META } from './vendor-columns';
import { VendorDetail } from './VendorDetail';
import type { VendorInfo } from './types';

interface VendorListProps {
  vendors: VendorInfo[];
  editVendorId?: string | null;
  onEditDone?: () => void;
  visibleColumns?: string[];
  onResetColumns?: () => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  onClearFilters?: () => void;
  isCustomView?: boolean;
  hasActiveFilters?: boolean;
}

export function VendorList({
  vendors,
  editVendorId,
  onEditDone,
  visibleColumns,
  onResetColumns,
  columnFilters,
  onColumnFiltersChange,
  columnVisibility,
  onColumnVisibilityChange,
  onClearFilters,
  isCustomView,
  hasActiveFilters,
}: VendorListProps) {
  const [selectedVendor, setSelectedVendor] = useState<VendorInfo | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (editVendorId) {
      const match = vendors.find((v) => v.id === editVendorId);
      if (match) {
        setSelectedVendor(match); // eslint-disable-line react-hooks/set-state-in-effect
        setEditMode(true);
      }
    }
  }, [editVendorId, vendors]);

  const columns = useMemo(
    () => buildVendorColumns((vendor) => {
      setSelectedVendor(vendor);
      setEditMode(false);
    }, visibleColumns),
    [visibleColumns],
  );

  const handleClose = () => {
    setSelectedVendor(null);
    setEditMode(false);
    if (editVendorId) onEditDone?.();
  };

  const handleSave = () => {
    handleClose();
    onEditDone?.();
  };

  return (
    <>
      {(isCustomView || hasActiveFilters) && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
          {isCustomView && onResetColumns && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onResetColumns}>
              <X className="h-3 w-3" />
              Reset columns
            </Button>
          )}
          {hasActiveFilters && columnFilters?.map((f) => {
            const label = COLUMN_META[f.id]?.label ?? f.id;
            const vals = f.value as string[];
            const display = vals.includes('*')
              ? 'has value'
              : vals.includes('')
                ? 'is empty'
                : vals.join(', ');
            return (
              <Button
                key={f.id}
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  onColumnFiltersChange?.((columnFilters ?? []).filter((cf) => cf.id !== f.id));
                }}
              >
                <X className="h-3 w-3" />
                {label}: {display}
              </Button>
            );
          })}
          {hasActiveFilters && (columnFilters?.length ?? 0) > 1 && onClearFilters && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onClearFilters}>
              <X className="h-3 w-3" />
              Clear all
            </Button>
          )}
        </div>
      )}
      <DataTable
        columns={columns}
        data={vendors}
        pinFirstColumn
        enableSearch
        enableColumnFilters
        columnFilters={columnFilters}
        onColumnFiltersChange={onColumnFiltersChange}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />
      <VendorDetail
        vendor={selectedVendor}
        open={selectedVendor !== null}
        onClose={handleClose}
        editing={editMode}
        onSave={handleSave}
      />
    </>
  );
}
