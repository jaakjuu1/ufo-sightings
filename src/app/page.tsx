import React from 'react';
import statsData from '@/data/stats.json';
import {
  type Stats, MONTH_NAMES, DOW_NAMES, shapeColor, shapeInfo, formatDuration, titleCase,
  COUNTRY_NAMES,
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
  const topState = stats.byState[0];
  const usCountry = stats.byCountry.find((c) => c.code === 'us');
  const fmtYear = (iso: string) => new Date(iso).getFullYear();

  // share of reports that happen in the evening/night (18:00–02:59)
  const nightCount = stats.byHour
    .filter((h) => h.hour >= 18 || h.hour <= 2)
    .reduce((a, h) => a + h.count, 0);
  const nightPct = Math.round((nightCount / stats.total) * 100);
  const usPct = usCountry ? Math.round((usCountry.count / stats.total) * 100) : 0;

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

  // shapes worth giving a glossary entry (skip the long tail of 1–2 report oddities)
  const glossaryShapes = stats.byShape.filter((s) => s.count >= 200);

  // narrative "did you know" insights
  const insights = [
    {
      icon: '🌃',
      title: 'A nighttime phenomenon',
      body: `${nightPct}% of all sightings happen between dusk and the small hours, peaking at ${peakHour.hour}:00. Bright objects simply stand out against a dark sky.`,
    },
    {
      icon: '📈',
      title: `The ${String(peakYear.year)} surge`,
      body: `Reports climbed from a handful in the 1950s to ${peakYear.count.toLocaleString()} in ${peakYear.year} — tracking the spread of camera phones and the internet as much as the skies.`,
    },
    {
      icon: '🇺🇸',
      title: 'Mostly an American record',
      body: `${usPct}% of reports come from the United States, where NUFORC is based. ${topState?.name} alone logged ${topState?.count.toLocaleString()} of them.`,
    },
    {
      icon: '⏱️',
      title: 'Gone in a flash',
      body: `The median encounter lasts just ${formatDuration(stats.medianDurationSec)}. Most are brief — a light that crosses the sky and vanishes before a phone is even out.`,
    },
  ];

  return (
    <>
      <nav className="topnav">
        <a className="topnav-brand" href="#top">
          <span className="topnav-badge">🛸</span>
          <span>UFO Atlas</span>
        </a>
        <div className="topnav-links">
          <a href="#insights">Insights</a>
          <a href="#charts">Patterns</a>
          <a href="#shapes">Shapes</a>
          <a href="#explore">Explore</a>
          <a className="topnav-cta" href="#explore">Search reports →</a>
        </div>
      </nav>

      <main className="page" id="top">
        <header className="hero">
          <div className="hero-aurora" aria-hidden />
          <div className="hero-inner">
            <span className="hero-pill">
              <span className="hero-pill-dot" />
              {stats.total.toLocaleString()} eyewitness reports · {fmtYear(stats.firstReport)}–{fmtYear(stats.lastReport)}
            </span>
            <h1 className="hero-title">
              A field atlas of <span className="hero-grad">UFO sightings</span>
            </h1>
            <p className="hero-lede">
              Eight decades of real reports from the{' '}
              <a href={stats.source.url} target="_blank" rel="noreferrer">National UFO Reporting Center</a>,
              mapped and broken down by shape, place, and time. Explore the patterns —
              then dig into individual accounts on the interactive map.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#explore">🔭 Explore the map</a>
              <a className="btn btn-ghost" href="#insights">See the highlights</a>
            </div>
            <ul className="hero-facts">
              <li><strong>{stats.countries}</strong> countries</li>
              <li><strong>{stats.shapes}</strong> shapes</li>
              <li><strong>{topShape ? cap(topShape.shape) : '—'}</strong> most reported</li>
              <li><strong>{peakHour.hour}:00</strong> peak hour</li>
            </ul>
          </div>
        </header>

        {/* headline stats */}
        <section className="stat-grid">
          <StatCard value={stats.total.toLocaleString()} label="Total reports" icon="🛸" accent="#a855f7" />
          <StatCard value={cap(topShape.shape)} label="Most reported shape" sub={`${topShape.count.toLocaleString()} reports`} icon="🔆" accent="#fbbf24" />
          <StatCard value={peakYear.year} label="Peak year" sub={`${peakYear.count.toLocaleString()} reports`} icon="📈" accent="#22d3ee" />
          <StatCard value={`${peakHour.hour}:00`} label="Most active hour" sub="local time of sighting" icon="🌙" accent="#34d399" />
          <StatCard value={formatDuration(stats.medianDurationSec)} label="Median duration" sub="half last less than this" icon="⏱️" accent="#f472b6" />
          <StatCard value={stats.shapes} label="Distinct shapes" sub="from light to chevron" icon="✨" accent="#fb923c" />
        </section>

        {/* live freshest reports straight from NUFORC (renders only when reachable) */}
        <LiveFeed />

        {/* narrative highlights */}
        <section className="insights" id="insights">
          <div className="section-head">
            <h2 className="section-title">What the data shows</h2>
            <p className="section-sub">Four takeaways before you dive into the charts.</p>
          </div>
          <div className="insight-grid">
            {insights.map((it) => (
              <article className="card insight-card" key={it.title}>
                <div className="insight-icon" aria-hidden>{it.icon}</div>
                <h3 className="insight-title">{it.title}</h3>
                <p className="insight-body">{it.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="charts">
          <div className="section-head">
            <h2 className="section-title">Patterns over space &amp; time</h2>
            <p className="section-sub">Hover any bar or column for exact figures; tap the <span className="info-dot info-dot-inline">i</span> for how to read each chart.</p>
          </div>
          <div className="grid">
            <Panel title="Reports per year" subtitle={`A steady rise from a handful in the 1950s to a peak in ${peakYear.year}.`} info="Each column is one calendar year. The tallest is highlighted. The climb reflects easier reporting (web, phones) as much as more sightings." wide>
              <ColumnChart data={yearCols} ticks={yearTicks} accent="#a855f7" height={170} highlightMax />
            </Panel>

            <Panel title="Most common shapes" subtitle="What people say they saw." info="Top 12 shape categories by number of reports. Colours match the map and the field guide below.">
              <BarList data={shapeBars} colorFor={shapeColorFor} />
            </Panel>

            <Panel title="Time of day" subtitle="Sightings cluster sharply after dark." info="Reports grouped by the local hour of the sighting (0–23). The evening and night-time spike is unmistakable.">
              <ColumnChart data={hourCols} ticks={hourTicks} accent="#34d399" height={150} highlightMax />
            </Panel>

            <Panel title="By month" subtitle="Summer evenings draw the most reports." info="All reports grouped by calendar month. Warm, clear evenings — and people being outdoors — lift the summer totals.">
              <ColumnChart data={monthCols} ticks={[0, 3, 6, 9, 11]} accent="#22d3ee" height={150} highlightMax />
            </Panel>

            <Panel title="By weekday" subtitle="Weekends edge ahead." info="Reports by day of the week. Friday and weekend evenings see slightly more sightings — more people out, looking up.">
              <ColumnChart data={dowCols} ticks={[0, 1, 2, 3, 4, 5, 6]} accent="#fb923c" height={150} highlightMax />
            </Panel>

            <Panel title="How long they lasted" subtitle="Most encounters are brief." info="Reported durations bucketed into ranges. The bulk are over in minutes; long, hours-plus sightings are rare.">
              <BarList data={durationBars} accent="#f472b6" />
            </Panel>

            <Panel title="Top countries" subtitle="Reporting is heavily US-centric." info="NUFORC is US-based, so the dataset skews strongly American. Treat this as a map of reporting, not of actual activity.">
              <BarList data={countryBars} accent="#a855f7" />
            </Panel>

            <Panel title="Top U.S. states" subtitle="Absolute report counts." info="Raw counts, not adjusted for population — bigger states naturally produce more reports.">
              <BarList data={stateBars} accent="#22d3ee" />
            </Panel>

            <Panel title="Top cities" subtitle="Hotspots by exact locality." info="The single most-reported localities. Population centres and well-known hotspots both show up here.">
              <BarList data={cityBars} accent="#34d399" />
            </Panel>

            <Panel title="Shape trends by decade" subtitle="Composition of the six most reported shapes over time." info="Each column is a decade; segments show how the mix of the six leading shapes shifted — note 'triangle' rising in later decades." wide>
              <StackedColumns rows={decadeRows} keys={stats.topShapeNames.map(cap)} colorFor={shapeColorFor} height={210} />
            </Panel>
          </div>
        </section>

        {/* field guide to shapes — the "extra info" glossary */}
        <section className="shapes-section" id="shapes">
          <div className="section-head">
            <h2 className="section-title">Field guide to shapes</h2>
            <p className="section-sub">
              Witnesses pick from a fixed vocabulary of shapes. Here is what each term means —
              and how often it turns up in {stats.total.toLocaleString()} reports.
            </p>
          </div>
          <div className="shape-grid">
            {glossaryShapes.map((s) => {
              const info = shapeInfo(s.shape);
              const color = shapeColor(s.shape);
              const pct = ((s.count / stats.total) * 100).toFixed(1);
              return (
                <article className="card shape-card" key={s.shape} style={{ ['--shape-color' as string]: color }}>
                  <div className="shape-card-head">
                    <span className="shape-emoji" aria-hidden>{info.icon}</span>
                    <span className="shape-name">{cap(s.shape)}</span>
                    <span className="shape-count">{s.count.toLocaleString()}</span>
                  </div>
                  <p className="shape-desc">{info.desc}</p>
                  <div className="shape-bar">
                    <span className="shape-bar-fill" style={{ width: `${Math.max(3, (s.count / glossaryShapes[0].count) * 100)}%`, background: color }} />
                  </div>
                  <div className="shape-pct">{pct}% of all reports</div>
                </article>
              );
            })}
          </div>
        </section>

        {/* interactive explorer */}
        <section className="explorer-section" id="explore">
          <div className="section-head">
            <h2 className="section-title">Explore the reports</h2>
            <p className="section-sub">Filter by location, shape, year or keyword. Click any point or row for the full account.</p>
          </div>
          <Explorer
            shapes={explorerShapes}
            countries={explorerCountries}
            yearMin={yearMin}
            yearMax={yearMax}
          />
        </section>

        {/* about / methodology — extra context on the data itself */}
        <section className="about-section">
          <div className="section-head">
            <h2 className="section-title">About this data</h2>
            <p className="section-sub">A few things worth knowing before you draw conclusions.</p>
          </div>
          <div className="about-grid">
            <article className="card about-card">
              <h3>📚 Where it comes from</h3>
              <p>
                {stats.total.toLocaleString()} reports from the{' '}
                <a href={stats.source.url} target="_blank" rel="noreferrer">{stats.source.name}</a>,
                combined via {stats.source.via}. Records span {fmtYear(stats.firstReport)} to {fmtYear(stats.lastReport)}
                {usCountry ? `, with ${COUNTRY_NAMES[usCountry.code] || 'the US'} contributing the majority.` : '.'}
              </p>
            </article>
            <article className="card about-card">
              <h3>🧭 How to read it</h3>
              <p>
                These are <strong>reports</strong>, not confirmed events. Geographic and yearly totals reflect
                where and when people <em>file</em> reports — driven by population, internet access and media
                attention — so they map reporting behaviour, not alien traffic.
              </p>
            </article>
            <article className="card about-card">
              <h3>⚠️ Take it with salt</h3>
              <p>
                Every entry is an unverified, subjective eyewitness account. Many have ordinary explanations —
                aircraft, satellites, planets, meteors and balloons. Treat the patterns as a study of human
                observation, not proof of anything.
              </p>
            </article>
            <article className="card about-card">
              <h3>🔄 Freshness</h3>
              <p>
                The snapshot rebuilds daily (last built {new Date(stats.generatedAt).toLocaleDateString()}). The
                “Latest from NUFORC” strip near the top updates live whenever the deployment can reach nuforc.org.
              </p>
            </article>
          </div>
        </section>

        <footer className="footer">
          <p>
            Data: {stats.source.name} via {stats.source.via}.
            {stats.liveReports ? ` ${stats.liveReports.toLocaleString()} reports merged from the live feed. ` : ' '}
            Reports are eyewitness accounts — unverified and inherently subjective. Built for curiosity, not proof.
          </p>
          <p className="footer-meta">Snapshot built {new Date(stats.generatedAt).toLocaleDateString()} · {stats.total.toLocaleString()} reports · {stats.countries} countries · {stats.shapes} shapes</p>
        </footer>
      </main>
    </>
  );
}
