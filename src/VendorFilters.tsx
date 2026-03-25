import { useState, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Button, Input } from '@haderach/shared-ui';
import { Check } from 'lucide-react';
import type { VendorInfo } from './types';

interface VendorFiltersProps {
  vendors: VendorInfo[];
  selectedVendors: string[];
  onVendorsChange: (vendors: string[]) => void;
}

export function VendorFilters({
  vendors,
  selectedVendors,
  onVendorsChange,
}: VendorFiltersProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const sortedVendors = [...vendors].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = search.trim()
    ? sortedVendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()))
    : sortedVendors;

  const toggleVendor = (id: string) => {
    if (selectedVendors.includes(id)) {
      onVendorsChange(selectedVendors.filter((v) => v !== id));
    } else {
      onVendorsChange([...selectedVendors, id]);
    }
  };

  const vendorLabel =
    selectedVendors.length === 0
      ? 'Select vendors'
      : selectedVendors.length === sortedVendors.length
        ? 'All vendors'
        : selectedVendors.length === 1
          ? vendors.find((v) => v.id === selectedVendors[0])?.name ?? selectedVendors[0]
          : `${selectedVendors.length} vendors selected`;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-sidebar-foreground/70">
        Vendors
      </label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button variant="outline" className="w-full justify-start font-normal">
            {vendorLabel}
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-50 w-64 rounded-lg border border-border bg-background shadow-lg"
            sideOffset={4}
            align="start"
          >
            <div className="p-2">
              <Input
                ref={inputRef}
                placeholder="Search vendors…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="flex gap-1 px-3 pb-1.5">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onVendorsChange(filtered.map((v) => v.id))}
              >
                {search.trim() ? 'Select matches' : 'Select all'}
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (search.trim()) {
                    const matchIds = new Set(filtered.map((v) => v.id));
                    onVendorsChange(selectedVendors.filter((id) => !matchIds.has(id)));
                  } else {
                    onVendorsChange([]);
                  }
                }}
              >
                Clear
              </button>
            </div>

            <div className="border-t border-border max-h-[280px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No vendors found
                </p>
              ) : (
                filtered.map((v) => {
                  const selected = selectedVendors.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent cursor-pointer text-left"
                      onClick={() => toggleVendor(v.id)}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary">
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                      <span className="truncate">{v.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
