import { useMemo } from 'react'
import { MultiSelect, Input, Button } from '@haderach/shared-ui'
import { BarChart3, Table2, Download } from 'lucide-react'
import { cn } from '@haderach/shared-ui'
import type { VendorInfo } from './types'

export type SpendViewMode = 'chart' | 'table'

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
    const depts = new Set<string>()
    for (const v of vendors) {
      if (v.department) depts.add(v.department)
    }
    return [...depts].sort().map((d) => ({ id: d, label: d }))
  }, [vendors])

  const vendorItems = useMemo(
    () => vendors.map((v) => ({ id: v.id, label: v.name })),
    [vendors],
  )

  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-border px-4 py-3">
      <div className="flex flex-col gap-1 min-w-[240px] flex-1 max-w-xs">
        <label className="text-xs font-medium text-muted-foreground">
          Department
        </label>
        <MultiSelect
          items={departmentItems}
          selectedIds={selectedDepartments}
          onSelectionChange={onDepartmentsChange}
          placeholder="All departments"
          searchPlaceholder="Search departments…"
        />
      </div>

      <div className="flex flex-col gap-1 min-w-[240px] flex-1 max-w-xs">
        <label className="text-xs font-medium text-muted-foreground">
          Vendor
        </label>
        <MultiSelect
          items={vendorItems}
          selectedIds={selectedVendors}
          onSelectionChange={onVendorsChange}
          placeholder="All vendors"
          searchPlaceholder="Search vendors…"
        />
      </div>

      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <Input
            type="date"
            className="w-[160px]"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <Input
            type="date"
            className="w-[160px]"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1 self-end">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", viewMode === 'chart' && "bg-accent")}
          onClick={() => onViewModeChange('chart')}
          aria-label="Chart view"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", viewMode === 'table' && "bg-accent")}
          onClick={() => onViewModeChange('table')}
          aria-label="Table view"
        >
          <Table2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onDownload}
          disabled={viewMode === 'chart'}
          aria-label="Download CSV"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
