import { Tabs, TabsList, TabsTrigger, TabsContent } from '@haderach/shared-ui';
import { SpendChart } from './SpendChart';
import { SpendTable } from './SpendTable';
import type { SpendRow } from './types';

interface SpendDataViewProps {
  rows: SpendRow[];
}

export function SpendDataView({ rows }: SpendDataViewProps) {
  if (rows.length === 0) return null;

  return (
    <Tabs defaultValue="chart">
      <TabsList>
        <TabsTrigger value="chart">Chart</TabsTrigger>
        <TabsTrigger value="table">Table</TabsTrigger>
      </TabsList>
      <TabsContent value="chart">
        <SpendChart rows={rows} />
      </TabsContent>
      <TabsContent value="table">
        <SpendTable rows={rows} />
      </TabsContent>
    </Tabs>
  );
}
