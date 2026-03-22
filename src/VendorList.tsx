import { useState, useMemo } from 'react';
import { DataTable } from '@haderach/shared-ui';
import { buildVendorColumns } from './vendor-columns';
import { VendorDetail } from './VendorDetail';
import type { VendorInfo } from './vendor-data';

interface VendorListProps {
  vendors: VendorInfo[];
}

export function VendorList({ vendors }: VendorListProps) {
  const [selectedVendor, setSelectedVendor] = useState<VendorInfo | null>(null);

  const columns = useMemo(
    () => buildVendorColumns((vendor) => setSelectedVendor(vendor)),
    [],
  );

  return (
    <>
      <DataTable columns={columns} data={vendors} csvFilename="vendors.csv" />
      <VendorDetail
        vendor={selectedVendor}
        open={selectedVendor !== null}
        onClose={() => setSelectedVendor(null)}
      />
    </>
  );
}
