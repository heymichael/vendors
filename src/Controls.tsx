import {
  Button,
  Input,
} from '@haderach/shared-ui'
import { VendorFilters } from './VendorFilters'

interface ControlsProps {
  selectedCategories: string[];
  selectedVendors: string[];
  dateFrom: string;
  dateTo: string;
  loading: boolean;
  onCategoriesChange: (categories: string[]) => void;
  onVendorsChange: (vendors: string[]) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onFetch: () => void;
}

export function Controls({
  selectedCategories,
  selectedVendors,
  dateFrom,
  dateTo,
  loading,
  onCategoriesChange,
  onVendorsChange,
  onDateFromChange,
  onDateToChange,
  onFetch,
}: ControlsProps) {
  return (
    <div className="flex flex-col gap-3 px-2">
      <VendorFilters
        selectedCategories={selectedCategories}
        selectedVendors={selectedVendors}
        onCategoriesChange={onCategoriesChange}
        onVendorsChange={onVendorsChange}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="date-from" className="text-xs font-medium text-sidebar-foreground/70">
          From
        </label>
        <Input
          type="date"
          id="date-from"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="date-to" className="text-xs font-medium text-sidebar-foreground/70">
          To
        </label>
        <Input
          type="date"
          id="date-to"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
        />
      </div>

      <Button onClick={onFetch} disabled={loading} className="w-full">
        {loading ? 'Loading…' : 'Fetch'}
      </Button>
    </div>
  );
}
