import { useMemo } from 'react'
import { MultiSelect, ViewModeToggle } from '@haderach/shared-ui'
import type { ViewMode } from '@haderach/shared-ui'
import type { VendorInfo } from './types'

export type SpendViewMode = ViewMode

interface SpendToolbarProps {
  vendors: VendorInfo[]
  selectedVendors: string[]
  onVendorsChange: (ids: string[]) => void
  selectedDepartments: string[]
  onDepartmentsChange: (ids: string[]) => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  viewMode: SpendViewMode
  onViewModeChange: (mode: SpendViewMode) => void
  onDownload?: () => void
}

export function SpendToolbar({
  vendors,
  selectedVendors,
  onVendorsChange,
  selectedDepartments,
  onDepartmentsChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  viewMode,
  onViewModeChange,
  onDownload,
}: SpendToolbarProps) {
  const departmentItems = useMemo(() => {
    const pool = selectedVendors.length === 0
      ? vendors
      : vendors.filter((v) => selectedVendors.includes(v.id))
    const depts = new Set<string>()
    for (const v of pool) {
      if (v.department) depts.add(v.department)
    }
    return [...depts].sort().map((d) => ({ id: d, label: d }))
  }, [vendors, selectedVendors])

  const vendorItems = useMemo(() => {
    if (selectedDepartments.length === 0) {
      return vendors.map((v) => ({ id: v.id, label: v.name }))
    }
    const deptSet = new Set(selectedDepartments)
    return vendors
      .filter((v) => v.department && deptSet.has(v.department))
      .map((v) => ({ id: v.id, label: v.name }))
  }, [vendors, selectedDepartments])

  return (
    <div className="flex flex-wrap items-end gap-6 px-4 py-2">
      <div className="flex flex-col gap-0.5 min-w-[120px]">
        <label className="text-xs font-medium text-muted-foreground">
          Department
        </label>
        <MultiSelect
          items={departmentItems}
          selectedIds={selectedDepartments}
          onSelectionChange={onDepartmentsChange}
          searchPlaceholder="Search departments…"
        />
      </div>

      <div className="flex flex-col gap-0.5 min-w-[120px]">
        <label className="text-xs font-medium text-muted-foreground">
          Vendor
        </label>
        <MultiSelect
          items={vendorItems}
          selectedIds={selectedVendors}
          onSelectionChange={onVendorsChange}
          searchPlaceholder="Search vendors…"
        />
      </div>

      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-0.5">
          <label className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <input
            type="date"
            className="h-8 w-[120px] bg-transparent text-xs outline-none [&::-webkit-calendar-picker-indicator]:h-3.5 [&::-webkit-calendar-picker-indicator]:w-3.5 [&::-webkit-calendar-picker-indicator]:opacity-60"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <input
            type="date"
            className="h-8 w-[120px] bg-transparent text-xs outline-none [&::-webkit-calendar-picker-indicator]:h-3.5 [&::-webkit-calendar-picker-indicator]:w-3.5 [&::-webkit-calendar-picker-indicator]:opacity-60"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
      </div>

      <ViewModeToggle
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onDownload={onDownload}
      />
    </div>
  )
}
