import { useMemo } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@haderach/shared-ui'
import type { VendorInfo } from './types';

interface VendorFiltersProps {
  vendors: VendorInfo[];
  selectedCategories: string[];
  selectedVendors: string[];
  onCategoriesChange: (categories: string[]) => void;
  onVendorsChange: (vendors: string[]) => void;
}

export function VendorFilters({
  vendors,
  selectedCategories,
  selectedVendors,
  onCategoriesChange,
  onVendorsChange,
}: VendorFiltersProps) {
  const allCategories = useMemo(
    () => [...new Set(vendors.map((v) => v.category))].sort(),
    [vendors],
  );

  const filteredVendorOptions = vendors.filter(
    (v) => selectedCategories.length === 0 || selectedCategories.includes(v.category),
  );

  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    onCategoriesChange(next);

    const vendorsInNextCategories = vendors
      .filter((v) => next.length === 0 || next.includes(v.category))
      .map((v) => v.id);
    onVendorsChange(vendorsInNextCategories);
  };

  const toggleVendor = (id: string) => {
    if (selectedVendors.includes(id)) {
      onVendorsChange(selectedVendors.filter((v) => v !== id));
    } else {
      onVendorsChange([...selectedVendors, id]);
    }
  };

  const categoryLabel =
    selectedCategories.length === 0 || selectedCategories.length === allCategories.length
      ? 'All categories'
      : selectedCategories.length === 1
        ? selectedCategories[0]
        : `${selectedCategories.length} categories`;

  const vendorLabel =
    selectedVendors.length === 0
      ? 'Select vendors'
      : selectedVendors.length === filteredVendorOptions.length
        ? 'All vendors'
        : selectedVendors.length === 1
          ? vendors.find((v) => v.id === selectedVendors[0])?.name ?? selectedVendors[0]
          : `${selectedVendors.length} vendors selected`;

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-sidebar-foreground/70">
          Category
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start font-normal">
              {categoryLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <div className="flex gap-1 px-2 py-1.5">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onCategoriesChange([...allCategories]);
                  onVendorsChange(vendors.map((v) => v.id));
                }}
              >
                Select all
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onCategoriesChange([]);
                  onVendorsChange([]);
                }}
              >
                Clear
              </button>
            </div>
            <DropdownMenuSeparator />
            {allCategories.map((cat) => (
              <DropdownMenuCheckboxItem
                key={cat}
                checked={selectedCategories.includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
                onSelect={(e) => e.preventDefault()}
              >
                {cat}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-sidebar-foreground/70">
          Vendors
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start font-normal">
              {vendorLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <div className="flex gap-1 px-2 py-1.5">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onVendorsChange(filteredVendorOptions.map((v) => v.id))}
              >
                Select all
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onVendorsChange([])}
              >
                Clear
              </button>
            </div>
            <DropdownMenuSeparator />
            {filteredVendorOptions.map((v) => (
              <DropdownMenuCheckboxItem
                key={v.id}
                checked={selectedVendors.includes(v.id)}
                onCheckedChange={() => toggleVendor(v.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {v.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
