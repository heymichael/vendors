import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import type { SpendRow } from './types';
import { OTHER_VENDOR } from './groupSpendRows';

const MIN_CHART_HEIGHT = 400;

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
  const [height, setHeight] = useState(0);
  const [activeVendor, setActiveVendor] = useState<string | null>(null);

  const measure = useCallback(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth);
      setHeight(containerRef.current.clientHeight);
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
    const totalByVendor = new Map<string, number>();
    const monthMap = new Map<string, Record<string, number>>();

    for (const row of rows) {
      totalByVendor.set(row.vendor, (totalByVendor.get(row.vendor) ?? 0) + row.amount);
      const existing = monthMap.get(row.month) ?? {};
      existing[row.vendor] = (existing[row.vendor] ?? 0) + row.amount;
      monthMap.set(row.month, existing);
    }

    const sortedMonths = [...monthMap.keys()].sort();
    const rankedVendors = [...totalByVendor.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([v]) => v);

    const chartData: ChartDatum[] = sortedMonths.map((month) => {
      const entry: ChartDatum = { month };
      for (const vendor of rankedVendors) {
        entry[vendor] = monthMap.get(month)?.[vendor] ?? 0;
      }
      return entry;
    });

    return { chartData, vendors: rankedVendors };
  }, [rows]);

  const formatMonth = (month: string) => {
    const [y, m] = month.split('-');
    const date = new Date(Number(y), Number(m) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const OTHER_COLOR = '#b0b0b0';

  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    let ci = 0;
    for (const v of vendors) {
      if (v === OTHER_VENDOR) {
        map.set(v, OTHER_COLOR);
      } else {
        map.set(v, VENDOR_COLORS[ci % VENDOR_COLORS.length]);
        ci++;
      }
    }
    return map;
  }, [vendors]);

  const chartHeight = Math.max(height - 32, MIN_CHART_HEIGHT);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 p-4"
    >
      {width > 0 && height > 0 && (
        <BarChart
          width={width - 32}
          height={chartHeight}
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
            fontSize={12}
            tickFormatter={formatMonth}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
            tickFormatter={(v: number) => currencyFmt.format(v)}
          />
          {activeVendor && (
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
          )}
          {vendors.map((vendor, i) => (
            <Bar
              key={vendor}
              dataKey={vendor}
              stackId="spend"
              fill={colorMap.get(vendor)}
              radius={i === vendors.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              onMouseEnter={() => setActiveVendor(vendor)}
              onMouseLeave={() => setActiveVendor(null)}
            >
              {chartData.map((_, idx) => (
                <Cell
                  key={idx}
                  fillOpacity={!activeVendor || activeVendor === vendor ? 1 : 0.65}
                />
              ))}
              {activeVendor === vendor && (
                <LabelList
                  dataKey={vendor}
                  position="center"
                  content={({ x, y, width: w, height: h, value }) => {
                    const num = Number(value);
                    if (!num || !w || !h) return null;
                    const barH = Number(h);
                    return (
                      <text
                        x={Number(x) + Number(w) / 2}
                        y={Number(y) + barH / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#fff"
                        fontSize={11}
                        fontWeight={600}
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
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
