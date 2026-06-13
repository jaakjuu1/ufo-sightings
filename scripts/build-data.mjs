// scripts/build-data.mjs
//
// Downloads the public NUFORC ("National UFO Reporting Center") dataset,
// cleans it, and produces two committed JSON artifacts the app ships with:
//
//   src/data/stats.json     – aggregate analytics computed over ALL reports
//   src/data/sightings.json – the full, cleaned record set (trimmed fields)
//
// Source: planetsig/ufo-reports — a scrubbed, geocoded, time-standardized
// export of NUFORC's public report database (~80k reports, 1949–2014).
// Run with:  npm run build:data

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'src/data');

const SOURCE_URL =
  process.env.UFO_DATA_URL ||
  'https://raw.githubusercontent.com/planetsig/ufo-reports/master/csv-data/ufo-scrubbed-geocoded-time-standardized.csv';

// Map the dataset's 2-letter country codes to readable names.
const COUNTRY_NAMES = {
  us: 'United States',
  ca: 'Canada',
  gb: 'United Kingdom',
  au: 'Australia',
  de: 'Germany',
};

const US_STATE_NAMES = {
  al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas', ca: 'California',
  co: 'Colorado', ct: 'Connecticut', de: 'Delaware', fl: 'Florida', ga: 'Georgia',
  hi: 'Hawaii', id: 'Idaho', il: 'Illinois', in: 'Indiana', ia: 'Iowa',
  ks: 'Kansas', ky: 'Kentucky', la: 'Louisiana', me: 'Maine', md: 'Maryland',
  ma: 'Massachusetts', mi: 'Michigan', mn: 'Minnesota', ms: 'Mississippi',
  mo: 'Missouri', mt: 'Montana', ne: 'Nebraska', nv: 'Nevada', nh: 'New Hampshire',
  nj: 'New Jersey', nm: 'New Mexico', ny: 'New York', nc: 'North Carolina',
  nd: 'North Dakota', oh: 'Ohio', ok: 'Oklahoma', or: 'Oregon', pa: 'Pennsylvania',
  ri: 'Rhode Island', sc: 'South Carolina', sd: 'South Dakota', tn: 'Tennessee',
  tx: 'Texas', ut: 'Utah', vt: 'Vermont', va: 'Virginia', wa: 'Washington',
  wv: 'West Virginia', wi: 'Wisconsin', wy: 'Wyoming', dc: 'Washington D.C.',
};

// ---------------------------------------------------------------------------
// CSV parsing (RFC-4180-ish: handles quoted fields with embedded commas/quotes)
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n') {
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else if (ch === '\r') {
      // ignore; handled by \n
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Decode the HTML entities NUFORC stores in the free-text comments.
function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/&#44;?/g, ',')
    .replace(/&#39;?/g, "'")
    .replace(/&quot;?/g, '"')
    .replace(/&amp;?/g, '&')
    .replace(/&lt;?/g, '<')
    .replace(/&gt;?/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// "10/10/1949 20:30" -> { iso, year, month(1-12), hour(0-23), dow(0-6) }
function parseDateTime(raw) {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, mo, day, yr, hr, min] = m.map(Number);
  if (yr < 1900 || yr > 2025 || mo < 1 || mo > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(yr, mo - 1, day, hr, min));
  if (Number.isNaN(dt.getTime())) return null;
  return {
    iso: dt.toISOString().slice(0, 16),
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    hour: dt.getUTCHours(),
    dow: dt.getUTCDay(),
  };
}

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  console.log(`↓ Fetching NUFORC dataset…\n  ${SOURCE_URL}`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const text = await res.text();
  console.log(`✓ Downloaded ${(text.length / 1e6).toFixed(1)} MB`);

  const rows = parseCSV(text);
  console.log(`✓ Parsed ${rows.length.toLocaleString()} raw rows`);

  const sightings = [];
  let dropped = 0;

  for (const r of rows) {
    if (r.length < 11) { dropped++; continue; }
    const [rawDate, city, state, country, shape, durSec, durText, comment, , latS, lngS] = r;

    const dt = parseDateTime(rawDate.trim());
    const lat = parseFloat(latS);
    const lng = parseFloat(lngS);

    if (!dt || !Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      dropped++;
      continue;
    }

    const shapeNorm = (shape || '').trim().toLowerCase() || 'unknown';

    sightings.push({
      datetime: dt.iso,
      year: dt.year,
      month: dt.month,
      hour: dt.hour,
      dow: dt.dow,
      city: city ? titleCase(decodeEntities(city)) : 'Unknown',
      state: (state || '').trim().toLowerCase(),
      country: (country || '').trim().toLowerCase(),
      shape: shapeNorm,
      durationSec: Number.isFinite(parseFloat(durSec)) ? Math.round(parseFloat(durSec)) : null,
      duration: decodeEntities(durText).slice(0, 40),
      summary: decodeEntities(comment).slice(0, 280),
      lat: Math.round(lat * 1e4) / 1e4,
      lng: Math.round(lng * 1e4) / 1e4,
    });
  }

  console.log(`✓ Kept ${sightings.length.toLocaleString()} valid records (dropped ${dropped.toLocaleString()})`);

  sightings.sort((a, b) => (a.datetime < b.datetime ? 1 : -1)); // newest first

  // -------------------------------------------------------------------------
  // Aggregate analytics over the FULL dataset
  // -------------------------------------------------------------------------
  const count = (arr, key) => {
    const m = new Map();
    for (const s of arr) {
      const k = typeof key === 'function' ? key(s) : s[key];
      if (k === undefined || k === null || k === '') continue;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  };
  const sortedEntries = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);

  const byShape = sortedEntries(count(sightings, 'shape')).map(([shape, c]) => ({ shape, count: c }));
  const byCountry = sortedEntries(count(sightings, 'country')).map(([code, c]) => ({
    code, name: COUNTRY_NAMES[code] || code.toUpperCase(), count: c,
  }));
  const byState = sortedEntries(count(sightings.filter((s) => s.country === 'us'), 'state'))
    .filter(([code]) => US_STATE_NAMES[code])
    .slice(0, 15)
    .map(([code, c]) => ({ code, name: US_STATE_NAMES[code], count: c }));
  const byCity = sortedEntries(count(sightings, (s) => `${s.city}|${s.state}|${s.country}`))
    .slice(0, 20)
    .map(([k, c]) => {
      const [city, state, country] = k.split('|');
      return { city, state: state.toUpperCase(), country: country.toUpperCase(), count: c };
    });

  // Time series
  const yearMap = count(sightings, 'year');
  const byYear = [...yearMap.entries()].sort((a, b) => a[0] - b[0]).map(([year, c]) => ({ year, count: c }));

  const byMonth = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }));
  const byHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  const byDow = Array.from({ length: 7 }, (_, i) => ({ dow: i, count: 0 }));
  for (const s of sightings) {
    byMonth[s.month - 1].count++;
    byHour[s.hour].count++;
    byDow[s.dow].count++;
  }

  // Decade x shape (top shapes only) for a "trends" view
  const topShapeNames = byShape.slice(0, 6).map((s) => s.shape);
  const decadeMap = new Map();
  for (const s of sightings) {
    const decade = Math.floor(s.year / 10) * 10;
    if (!decadeMap.has(decade)) {
      decadeMap.set(decade, { decade, total: 0, ...Object.fromEntries(topShapeNames.map((n) => [n, 0])) });
    }
    const d = decadeMap.get(decade);
    d.total++;
    if (topShapeNames.includes(s.shape)) d[s.shape]++;
  }
  const byDecade = [...decadeMap.values()].sort((a, b) => a.decade - b.decade);

  // Duration distribution (buckets, seconds)
  const durBuckets = [
    { label: '< 10s', max: 10, count: 0 },
    { label: '10–30s', max: 30, count: 0 },
    { label: '30s–1m', max: 60, count: 0 },
    { label: '1–5m', max: 300, count: 0 },
    { label: '5–15m', max: 900, count: 0 },
    { label: '15m–1h', max: 3600, count: 0 },
    { label: '> 1h', max: Infinity, count: 0 },
  ];
  const durations = [];
  for (const s of sightings) {
    if (s.durationSec == null || s.durationSec <= 0) continue;
    durations.push(s.durationSec);
    for (const b of durBuckets) { if (s.durationSec <= b.max) { b.count++; break; } }
  }
  durations.sort((a, b) => a - b);
  const medianDuration = durations.length ? durations[Math.floor(durations.length / 2)] : null;

  const stats = {
    generatedAt: new Date().toISOString(),
    source: {
      name: 'National UFO Reporting Center (NUFORC)',
      via: 'planetsig/ufo-reports (scrubbed, geocoded)',
      url: 'https://nuforc.org',
    },
    total: sightings.length,
    firstReport: sightings[sightings.length - 1]?.datetime,
    lastReport: sightings[0]?.datetime,
    countries: byCountry.length,
    shapes: byShape.length,
    medianDurationSec: medianDuration,
    byShape,
    byCountry,
    byState,
    byCity,
    byYear,
    byMonth,
    byHour,
    byDow,
    byDecade,
    topShapeNames,
    durationBuckets: durBuckets.map(({ label, count }) => ({ label, count })),
  };

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(resolve(DATA_DIR, 'stats.json'), JSON.stringify(stats));
  writeFileSync(resolve(DATA_DIR, 'sightings.json'), JSON.stringify(sightings));

  const mb = (n) => (n / 1e6).toFixed(1);
  console.log(`\n✓ Wrote src/data/stats.json`);
  console.log(`✓ Wrote src/data/sightings.json (${mb(JSON.stringify(sightings).length)} MB, ${sightings.length.toLocaleString()} records)`);
  console.log(`\nCoverage: ${stats.firstReport} → ${stats.lastReport} across ${stats.countries} countries.`);
}

main().catch((err) => {
  console.error('✗ build-data failed:', err);
  process.exit(1);
});
