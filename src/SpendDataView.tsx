import { SpendChart } from './SpendChart';
import { SpendTable } from './SpendTable';
import type { SpendRow } from './types';
import type { SpendViewMode } from './SpendToolbar';

interface SpendDataViewProps {
  rows: SpendRow[];
  viewMode: SpendViewMode;
}

export function SpendDataView({ rows, viewMode }: SpendDataViewProps) {
  if (rows.length === 0) return null;

  return viewMode === 'chart' ? (
    <div className="flex flex-1 min-h-0 flex-col">
      <SpendChart rows={rows} />
    </div>
  ) : (
    <SpendTable rows={rows} />
  );
}
