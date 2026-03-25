import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { SpendRow } from './types';

const CHART_HEIGHT = 500;

const VENDOR_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

interface SpendChartProps {
  rows: SpendRow[];
}

interface ChartDatum {
  month: string;
  [vendor: string]: string | number;
}

export function SpendChart({ rows }: SpendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const measure = useCallback(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const { chartData, vendors } = useMemo(() => {
    const vendorSet = new Set<string>();
    const monthMap = new Map<string, Record<string, number>>();

    for (const row of rows) {
      vendorSet.add(row.vendor);
      const existing = monthMap.get(row.month) ?? {};
      existing[row.vendor] = (existing[row.vendor] ?? 0) + row.amount;
      monthMap.set(row.month, existing);
    }

    const sortedMonths = [...monthMap.keys()].sort();
    const sortedVendors = [...vendorSet].sort();

    const chartData: ChartDatum[] = sortedMonths.map((month) => {
      const entry: ChartDatum = { month };
      for (const vendor of sortedVendors) {
        entry[vendor] = monthMap.get(month)?.[vendor] ?? 0;
      }
      return entry;
    });

    return { chartData, vendors: sortedVendors };
  }, [rows]);

  const formatMonth = (month: string) => {
    const [y, m] = month.split('-');
    const date = new Date(Number(y), Number(m) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-border bg-surface p-4"
      style={{ minHeight: CHART_HEIGHT }}
    >
      {width > 0 && (
        <BarChart
          width={width - 32}
          height={CHART_HEIGHT}
          data={chartData}
          margin={{ top: 10, right: 10, bottom: 20, left: 20 }}
        >
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            fontSize={14}
            tickFormatter={formatMonth}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={14}
            tickFormatter={(v: number) => currencyFmt.format(v)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-lg">
                  {payload.map((entry) => (
                    <p key={entry.name} style={{ color: entry.color }} className="flex justify-between gap-4">
                      <span>{entry.name}</span>
                      <span className="font-mono">{currencyFmt.format(Number(entry.value))}</span>
                    </p>
                  ))}
                </div>
              );
            }}
          />
          {vendors.map((vendor, i) => (
            <Bar
              key={vendor}
              dataKey={vendor}
              stackId="spend"
              fill={VENDOR_COLORS[i % VENDOR_COLORS.length]}
              radius={i === vendors.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      )}
    </div>
  );
}
