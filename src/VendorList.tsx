import { useState, useMemo, useEffect } from 'react';
import { DataTable } from '@haderach/shared-ui';
import { buildVendorColumns } from './vendor-columns';
import { VendorDetail } from './VendorDetail';
import type { VendorInfo } from './types';

interface VendorListProps {
  vendors: VendorInfo[];
  editVendorId?: string | null;
  onEditDone?: () => void;
}

export function VendorList({ vendors, editVendorId, onEditDone }: VendorListProps) {
  const [selectedVendor, setSelectedVendor] = useState<VendorInfo | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (editVendorId) {
      const match = vendors.find((v) => v.id === editVendorId);
      if (match) {
        setSelectedVendor(match);
        setEditMode(true);
      }
    }
  }, [editVendorId, vendors]);

  const columns = useMemo(
    () => buildVendorColumns((vendor) => {
      setSelectedVendor(vendor);
      setEditMode(false);
    }),
    [],
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
      <DataTable columns={columns} data={vendors} csvFilename="vendors.csv" />
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
