import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import type { SpendRow } from './types';

const CHART_HEIGHT = 750;

const VENDOR_COLORS = [
  '#6b9bd2',
  '#7bc8a4',
  '#d4a574',
  '#b491c8',
  '#e8a0a0',
  '#8cc5c5',
  '#c4b078',
  '#a0b8d8',
  '#c9a0c9',
  '#90c490',
];

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const compactFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
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
  const [activeVendor, setActiveVendor] = useState<string | null>(null);

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

  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    vendors.forEach((v, i) => map.set(v, VENDOR_COLORS[i % VENDOR_COLORS.length]));
    return map;
  }, [vendors]);

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
          onMouseLeave={() => setActiveVendor(null)}
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
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length || !activeVendor) return null;
              const entry = payload.find((p) => p.name === activeVendor);
              if (!entry) return null;
              return (
                <div className="rounded-md border border-border bg-background px-3 py-1.5 text-sm shadow-md">
                  {entry.name}
                </div>
              );
            }}
          />
          {vendors.map((vendor, i) => (
            <Bar
              key={vendor}
              dataKey={vendor}
              stackId="spend"
              fill={colorMap.get(vendor)}
              radius={i === vendors.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              onMouseEnter={() => setActiveVendor(vendor)}
            >
              {chartData.map((_, idx) => (
                <Cell
                  key={idx}
                  fillOpacity={!activeVendor || activeVendor === vendor ? 1 : 0.5}
                />
              ))}
              {activeVendor === vendor && (
                <LabelList
                  dataKey={vendor}
                  position="center"
                  content={({ x, y, width: w, height: h, value }) => {
                    const num = Number(value);
                    if (!num || !w || !h || Number(h) < 16) return null;
                    return (
                      <text
                        x={Number(x) + Number(w) / 2}
                        y={Number(y) + Number(h) / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#fff"
                        fontSize={11}
                        fontWeight={600}
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                      >
                        {compactFmt.format(num)}
                      </text>
                    );
                  }}
                />
              )}
            </Bar>
          ))}
        </BarChart>
      )}
    </div>
  );
}
