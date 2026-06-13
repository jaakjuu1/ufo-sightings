import React from 'react';
import statsData from '@/data/stats.json';
import {
  type Stats, MONTH_NAMES, DOW_NAMES, shapeColor, formatDuration, titleCase,
} from '@/lib/types';
import { StatCard, BarList, ColumnChart, StackedColumns, Panel } from '@/components/charts';
import Explorer from '@/components/Explorer';
import LiveFeed from '@/components/LiveFeed';

const stats = statsData as Stats;

export default function Home() {
  const cap = (s: string) => titleCase(s);

  // --- derive a few headline figures ---
  const peakYear = stats.byYear.reduce((a, b) => (b.count > a.count ? b : a), stats.byYear[0]);
  const peakHour = stats.byHour.reduce((a, b) => (b.count > a.count ? b : a), stats.byHour[0]);
  const topShape = stats.byShape[0];
  const fmtYear = (iso: string) => new Date(iso).getFullYear();

  // --- chart inputs ---
  const shapeBars = stats.byShape.slice(0, 12).map((s) => ({
    label: cap(s.shape), value: s.count, hint: s.shape,
  }));
  const countryBars = stats.byCountry.map((c) => ({ label: c.name, value: c.count }));
  const stateBars = stats.byState.slice(0, 12).map((s) => ({ label: s.name, value: s.count }));
  const cityBars = stats.byCity.slice(0, 12).map((c) => ({
    label: `${c.city}, ${c.state || c.country}`, value: c.count,
  }));
  const durationBars = stats.durationBuckets.map((b) => ({ label: b.label, value: b.count }));

  const yearCols = stats.byYear.map((y) => ({ label: String(y.year), value: y.count, full: String(y.year) }));
  const yearTicks = (() => {
    const idx: number[] = [];
    for (let i = 0; i < stats.byYear.length; i++) {
      if (stats.byYear[i].year % 10 === 0) idx.push(i);
    }
    return idx;
  })();

  const monthCols = stats.byMonth.map((m) => ({ label: MONTH_NAMES[m.month - 1], value: m.count }));
  const hourCols = stats.byHour.map((h) => ({
    label: `${h.hour}`, value: h.count, full: `${h.hour}:00`,
  }));
  const hourTicks = [0, 3, 6, 9, 12, 15, 18, 21];
  const dowCols = stats.byDow.map((d) => ({ label: DOW_NAMES[d.dow], value: d.count }));

  const decadeRows = stats.byDecade
    .filter((d) => d.total > 0)
    .map((d) => ({
      label: `${String(d.decade).slice(2)}s`,
      total: d.total,
      segments: stats.topShapeNames.map((k) => ({ key: k, value: (d[k] as number) || 0 })),
    }));

  const shapeColorFor = (label: string) => shapeColor(label.toLowerCase());

  const explorerShapes = stats.byShape.map((s) => s.shape);
  const explorerCountries = stats.byCountry.map((c) => ({ code: c.code, name: c.name }));
  const yearMin = stats.byYear[0]?.year ?? 1949;
  const yearMax = stats.byYear[stats.byYear.length - 1]?.year ?? 2014;

  return (
    <main className="page">
      <header className="hero">
        <div className="hero-badge">🛸</div>
        <div className="hero-text">
          <h1>UFO Sightings Atlas</h1>
          <p>
            {stats.total.toLocaleString()} real reports from the{' '}
            <a href={stats.source.url} target="_blank" rel="noreferrer">National UFO Reporting Center</a>,{' '}
            {fmtYear(stats.firstReport)}–{fmtYear(stats.lastReport)}, across {stats.countries} countries.
          </p>
        </div>
      </header>

      {/* headline stats */}
      <section className="stat-grid">
        <StatCard value={stats.total.toLocaleString()} label="Total reports" accent="#a855f7" />
        <StatCard value={cap(topShape.shape)} label="Most reported shape" sub={`${topShape.count.toLocaleString()} reports`} accent="#fbbf24" />
        <StatCard value={peakYear.year} label="Peak year" sub={`${peakYear.count.toLocaleString()} reports`} accent="#22d3ee" />
        <StatCard value={`${peakHour.hour}:00`} label="Most active hour" sub="local time of sighting" accent="#34d399" />
        <StatCard value={formatDuration(stats.medianDurationSec)} label="Median duration" accent="#f472b6" />
        <StatCard value={stats.shapes} label="Distinct shapes" accent="#fb923c" />
      </section>

      {/* live freshest reports straight from NUFORC (renders only when reachable) */}
      <LiveFeed />

      <div className="grid">
        <Panel title="Reports per year" subtitle={`A steady rise from a handful in the 1950s to a peak in ${peakYear.year}.`} wide>
          <ColumnChart data={yearCols} ticks={yearTicks} accent="#a855f7" height={170} highlightMax />
        </Panel>

        <Panel title="Most common shapes" subtitle="What people say they saw.">
          <BarList data={shapeBars} colorFor={shapeColorFor} />
        </Panel>

        <Panel title="Time of day" subtitle="Sightings cluster sharply after dark.">
          <ColumnChart data={hourCols} ticks={hourTicks} accent="#34d399" height={150} highlightMax />
        </Panel>

        <Panel title="By month" subtitle="Summer evenings draw the most reports.">
          <ColumnChart data={monthCols} ticks={[0, 3, 6, 9, 11]} accent="#22d3ee" height={150} highlightMax />
        </Panel>

        <Panel title="By weekday" subtitle="Weekends edge ahead.">
          <ColumnChart data={dowCols} ticks={[0, 1, 2, 3, 4, 5, 6]} accent="#fb923c" height={150} highlightMax />
        </Panel>

        <Panel title="How long they lasted" subtitle="Most encounters are brief.">
          <BarList data={durationBars} accent="#f472b6" />
        </Panel>

        <Panel title="Top countries" subtitle="Reporting is heavily US-centric.">
          <BarList data={countryBars} accent="#a855f7" />
        </Panel>

        <Panel title="Top U.S. states" subtitle="Absolute report counts.">
          <BarList data={stateBars} accent="#22d3ee" />
        </Panel>

        <Panel title="Top cities" subtitle="Hotspots by exact locality.">
          <BarList data={cityBars} accent="#34d399" />
        </Panel>

        <Panel title="Shape trends by decade" subtitle="Composition of the six most reported shapes over time." wide>
          <StackedColumns rows={decadeRows} keys={stats.topShapeNames.map(cap)} colorFor={shapeColorFor} height={210} />
        </Panel>
      </div>

      {/* interactive explorer */}
      <section className="explorer-section">
        <div className="panel-head">
          <h2 className="panel-title">Explore the reports</h2>
          <p className="panel-sub">Filter by location, shape, year or keyword. Click any point or row for the full report.</p>
        </div>
        <Explorer
          shapes={explorerShapes}
          countries={explorerCountries}
          yearMin={yearMin}
          yearMax={yearMax}
        />
      </section>

      <footer className="footer">
        <p>
          Data: {stats.source.name} via {stats.source.via}.
          {stats.liveReports ? ` ${stats.liveReports.toLocaleString()} reports merged from the live feed. ` : ' '}
          The snapshot auto-refreshes daily; the “Latest from NUFORC” strip updates live when
          the deployment can reach nuforc.org. Reports are eyewitness accounts — unverified and
          inherently subjective. Snapshot built {new Date(stats.generatedAt).toLocaleDateString()}.
        </p>
      </footer>
    </main>
  );
}
