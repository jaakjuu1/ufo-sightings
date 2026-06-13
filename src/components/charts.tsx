// src/components/charts.tsx
// Lightweight, dependency-free presentational charts (server-rendered SVG/CSS).
import React from 'react';

export function StatCard({
  value,
  label,
  sub,
  accent = '#a855f7',
  icon,
}: {
  value: React.ReactNode;
  label: string;
  sub?: string;
  accent?: string;
  icon?: string;
}) {
  return (
    <div className="card stat-card" style={{ ['--stat-accent' as string]: accent }}>
      <div className="stat-glow" style={{ background: accent }} />
      {icon && <div className="stat-icon" aria-hidden>{icon}</div>}
      <div className="stat-value" style={{ color: accent }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// A small "i" affordance that reveals an explanatory note on hover/focus.
// Used in panel headers to explain how to read each chart.
export function InfoDot({ text }: { text: string }) {
  return (
    <span className="info-dot" tabIndex={0} role="note" aria-label={text}>
      i
      <span className="info-pop">{text}</span>
    </span>
  );
}

// Horizontal ranked bars: shapes, countries, states, cities, duration buckets.
export function BarList({
  data,
  max,
  accent = '#a855f7',
  colorFor,
  formatValue = (n) => n.toLocaleString(),
}: {
  data: { label: string; value: number; hint?: string }[];
  max?: number;
  accent?: string;
  colorFor?: (label: string) => string;
  formatValue?: (n: number) => string;
}) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="barlist">
      {data.map((d) => (
        <div className="barlist-row" key={d.label}>
          <div className="barlist-label" title={d.hint || d.label}>{d.label}</div>
          <div className="barlist-track">
            <div
              className="barlist-fill"
              style={{ width: `${(d.value / top) * 100}%`, background: colorFor ? colorFor(d.label) : accent }}
            />
          </div>
          <div className="barlist-value">{formatValue(d.value)}</div>
        </div>
      ))}
    </div>
  );
}

// Vertical column chart for time series (years, hours, months, weekdays).
export function ColumnChart({
  data,
  accent = '#a855f7',
  height = 160,
  ticks = [],
  highlightMax = false,
}: {
  data: { label: string; value: number; full?: string }[];
  accent?: string;
  height?: number;
  ticks?: number[]; // indices to label on the x-axis
  highlightMax?: boolean;
}) {
  const W = 1000;
  const H = height;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const gap = n > 60 ? 0.15 : 0.3;
  const bw = W / n;
  const maxIdx = data.reduce((mi, d, i) => (d.value > data[mi].value ? i : mi), 0);

  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} className="colchart" preserveAspectRatio="none" role="img">
      {data.map((d, i) => {
        const h = (d.value / max) * (H - 4);
        const x = i * bw + (bw * gap) / 2;
        const w = bw * (1 - gap);
        const fill = highlightMax && i === maxIdx ? '#f472b6' : accent;
        return (
          <rect key={i} x={x} y={H - h} width={w} height={h} rx={n > 60 ? 0.5 : 2} fill={fill}>
            <title>{`${d.full || d.label}: ${d.value.toLocaleString()}`}</title>
          </rect>
        );
      })}
      {ticks.map((ti) => (
        <text
          key={ti}
          x={ti * bw + bw / 2}
          y={H + 16}
          textAnchor="middle"
          fontSize="13"
          fill="#71717a"
        >
          {data[ti]?.label}
        </text>
      ))}
    </svg>
  );
}

// Stacked columns: per-decade composition by top shapes.
export function StackedColumns({
  rows,
  keys,
  colorFor,
  height = 200,
}: {
  rows: { label: string; segments: { key: string; value: number }[]; total: number }[];
  keys: string[];
  colorFor: (key: string) => string;
  height?: number;
}) {
  const W = 1000;
  const H = height;
  const max = Math.max(1, ...rows.map((r) => r.total));
  const n = rows.length;
  const bw = W / n;
  const gap = 0.3;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="colchart" preserveAspectRatio="none" role="img">
        {rows.map((r, i) => {
          let acc = 0;
          const x = i * bw + (bw * gap) / 2;
          const w = bw * (1 - gap);
          return (
            <g key={r.label}>
              {r.segments.map((seg) => {
                const segH = (seg.value / max) * (H - 4);
                const y = H - acc - segH;
                acc += segH;
                return (
                  <rect key={seg.key} x={x} y={y} width={w} height={segH} fill={colorFor(seg.key)}>
                    <title>{`${r.label} — ${seg.key}: ${seg.value.toLocaleString()}`}</title>
                  </rect>
                );
              })}
              <text x={x + w / 2} y={H + 16} textAnchor="middle" fontSize="13" fill="#71717a">
                {r.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="legend">
        {keys.map((k) => (
          <span className="legend-item" key={k}>
            <span className="legend-dot" style={{ background: colorFor(k) }} />
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  children,
  wide,
  info,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
  info?: string;
}) {
  return (
    <section className={`card panel${wide ? ' panel-wide' : ''}`}>
      <div className="panel-head">
        <h2 className="panel-title">
          {title}
          {info && <InfoDot text={info} />}
        </h2>
        {subtitle && <p className="panel-sub">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
