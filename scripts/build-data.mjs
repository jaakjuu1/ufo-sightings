// scripts/build-data.mjs
//
// Builds the two committed data artifacts the app ships with:
//   src/data/stats.json     – aggregate analytics over ALL reports
//   src/data/sightings.json – the full, cleaned record set (trimmed fields)
//
// Sources, merged newest-on-top and de-duplicated:
//   1. BASELINE  – the existing committed snapshot if present, otherwise a
//      one-time bootstrap from planetsig/ufo-reports (NUFORC, 1949–2014).
//   2. LIVE      – recent reports fetched directly from nuforc.org. New reports
//      are geocoded from a gazetteer derived from the historical data (+ state
//      and country centroids), so no external geocoder is needed.
//
// NUFORC is frequently unreachable from sandboxed/allowlisted networks; the live
// step is best-effort and never fails the build. GitHub Actions runners have
// open egress, so the scheduled refresh workflow is where live data really lands.
//
// Run:  npm run build:data            (incremental: snapshot + recent NUFORC)
//       UFO_BOOTSTRAP=1 npm run ...    (force re-bootstrap from planetsig)
//       NUFORC_SINCE_DAYS=365 npm ...  (widen the live window)

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchRecentNuforc } from './sources/nuforc.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'src/data');
const SIGHTINGS_FILE = resolve(DATA_DIR, 'sightings.json');

const PLANETSIG_URL =
  process.env.UFO_DATA_URL ||
  'https://raw.githubusercontent.com/planetsig/ufo-reports/master/csv-data/ufo-scrubbed-geocoded-time-standardized.csv';

const COUNTRY_NAMES = {
  us: 'United States', ca: 'Canada', gb: 'United Kingdom', au: 'Australia', de: 'Germany',
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

// Approximate geographic centroids for fallback geocoding.
const US_STATE_CENTROIDS = {
  al: [32.8, -86.8], ak: [64.2, -149.5], az: [34.2, -111.7], ar: [34.9, -92.4],
  ca: [37.2, -119.4], co: [39.0, -105.5], ct: [41.6, -72.7], de: [39.0, -75.5],
  fl: [28.6, -82.4], ga: [32.6, -83.4], hi: [20.3, -156.4], id: [44.4, -114.6],
  il: [40.0, -89.2], in: [39.9, -86.3], ia: [42.0, -93.5], ks: [38.5, -98.4],
  ky: [37.5, -85.3], la: [31.1, -92.0], me: [45.4, -69.2], md: [39.0, -76.8],
  ma: [42.3, -71.8], mi: [44.3, -85.4], mn: [46.3, -94.3], ms: [32.7, -89.7],
  mo: [38.4, -92.5], mt: [47.0, -109.6], ne: [41.5, -99.8], nv: [39.3, -116.6],
  nh: [43.7, -71.6], nj: [40.1, -74.7], nm: [34.4, -106.1], ny: [42.9, -75.6],
  nc: [35.6, -79.4], nd: [47.5, -100.5], oh: [40.3, -82.8], ok: [35.6, -97.5],
  or: [44.0, -120.5], pa: [40.9, -77.8], ri: [41.7, -71.6], sc: [33.9, -80.9],
  sd: [44.4, -100.2], tn: [35.9, -86.4], tx: [31.5, -99.3], ut: [39.3, -111.7],
  vt: [44.1, -72.7], va: [37.5, -78.9], wa: [47.4, -120.5], wv: [38.6, -80.6],
  wi: [44.6, -89.9], wy: [43.0, -107.5], dc: [38.9, -77.0],
};
const COUNTRY_CENTROIDS = {
  us: [39.8, -98.6], ca: [56.1, -106.3], gb: [54.0, -2.0], au: [-25.3, 133.8], de: [51.2, 10.4],
};

// ---------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let field = '', row = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); field = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else if (ch !== '\r') field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/&#44;?/g, ',').replace(/&#39;?/g, "'").replace(/&quot;?/g, '"')
    .replace(/&amp;?/g, '&').replace(/&lt;?/g, '<').replace(/&gt;?/g, '>')
    .replace(/\s+/g, ' ').trim();
}

function parseDateTime(raw) {
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, mo, day, yr, hr, min] = m.map(Number);
  if (yr < 1900 || yr > 2025 || mo < 1 || mo > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(yr, mo - 1, day, hr, min));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// One-time bootstrap of the historical archive from planetsig.
async function fetchPlanetsig(log) {
  log(`↓ Bootstrapping baseline from planetsig\n  ${PLANETSIG_URL}`);
  const res = await fetch(PLANETSIG_URL);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const text = await res.text();
  const rows = parseCSV(text);
  const out = [];
  for (const r of rows) {
    if (r.length < 11) continue;
    const [rawDate, city, state, country, shape, durSec, durText, comment, , latS, lngS] = r;
    const dt = parseDateTime(rawDate.trim());
    const lat = parseFloat(latS), lng = parseFloat(lngS);
    if (!dt || !Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue;
    out.push({
      datetime: dt.toISOString().slice(0, 16),
      year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1,
      hour: dt.getUTCHours(), dow: dt.getUTCDay(),
      city: city ? titleCase(decodeEntities(city)) : 'Unknown',
      state: (state || '').trim().toLowerCase(),
      country: (country || '').trim().toLowerCase(),
      shape: (shape || '').trim().toLowerCase() || 'unknown',
      durationSec: Number.isFinite(parseFloat(durSec)) ? Math.round(parseFloat(durSec)) : null,
      duration: decodeEntities(durText).slice(0, 40),
      summary: decodeEntities(comment).slice(0, 280),
      lat: Math.round(lat * 1e4) / 1e4, lng: Math.round(lng * 1e4) / 1e4,
      source: 'planetsig',
    });
  }
  log(`✓ Bootstrapped ${out.length.toLocaleString()} historical records`);
  return out;
}

function loadBaseline(log) {
  if (!process.env.UFO_BOOTSTRAP && existsSync(SIGHTINGS_FILE)) {
    const arr = JSON.parse(readFileSync(SIGHTINGS_FILE, 'utf8'));
    log(`✓ Loaded ${arr.length.toLocaleString()} records from existing snapshot`);
    return arr;
  }
  return fetchPlanetsig(log);
}

// Build a city→coordinate gazetteer from already-geocoded baseline records.
function buildGazetteer(baseline) {
  const acc = new Map(); // key -> {lat,lng,n}
  const add = (key, lat, lng) => {
    const e = acc.get(key);
    if (e) { e.lat += lat; e.lng += lng; e.n++; }
    else acc.set(key, { lat, lng, n: 1 });
  };
  for (const s of baseline) {
    if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) continue;
    const city = s.city.toLowerCase();
    add(`${city}|${s.state}|${s.country}`, s.lat, s.lng);
    add(`${city}|${s.country}`, s.lat, s.lng);
  }
  const gaz = new Map();
  for (const [k, v] of acc) gaz.set(k, { lat: v.lat / v.n, lng: v.lng / v.n });

  return ({ city, state, country }) => {
    const c = (city || '').toLowerCase();
    const hit = gaz.get(`${c}|${state}|${country}`) || gaz.get(`${c}|${country}`);
    if (hit) return hit;
    if (country === 'us' && US_STATE_CENTROIDS[state]) {
      const [lat, lng] = US_STATE_CENTROIDS[state];
      return { lat, lng };
    }
    if (COUNTRY_CENTROIDS[country]) {
      const [lat, lng] = COUNTRY_CENTROIDS[country];
      return { lat, lng };
    }
    return null;
  };
}

const dedupeKey = (s) =>
  `${s.datetime}|${(s.city || '').toLowerCase()}|${s.state}|${(s.summary || '').slice(0, 30).toLowerCase()}`;

function mergeReports(baseline, recent, log) {
  const map = new Map();
  for (const s of baseline) map.set(dedupeKey(s), s);
  let added = 0;
  for (const s of recent) {
    if (s.lat == null || s.lng == null) continue; // could not geocode at all
    const k = dedupeKey(s);
    if (!map.has(k)) { map.set(k, s); added++; }
  }
  const merged = [...map.values()].sort((a, b) => (a.datetime < b.datetime ? 1 : -1));
  log(`✓ Merged: ${baseline.length.toLocaleString()} baseline + ${added.toLocaleString()} new = ${merged.length.toLocaleString()} total`);
  return merged;
}

// ---------------------------------------------------------------------------
function aggregate(sightings) {
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
    .filter(([code]) => US_STATE_NAMES[code]).slice(0, 15)
    .map(([code, c]) => ({ code, name: US_STATE_NAMES[code], count: c }));
  const byCity = sortedEntries(count(sightings, (s) => `${s.city}|${s.state}|${s.country}`))
    .slice(0, 20).map(([k, c]) => {
      const [city, state, country] = k.split('|');
      return { city, state: state.toUpperCase(), country: country.toUpperCase(), count: c };
    });

  const byYear = [...count(sightings, 'year').entries()].sort((a, b) => a[0] - b[0])
    .map(([year, c]) => ({ year, count: c }));
  const byMonth = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }));
  const byHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  const byDow = Array.from({ length: 7 }, (_, i) => ({ dow: i, count: 0 }));
  for (const s of sightings) { byMonth[s.month - 1].count++; byHour[s.hour].count++; byDow[s.dow].count++; }

  const topShapeNames = byShape.slice(0, 6).map((s) => s.shape);
  const decadeMap = new Map();
  for (const s of sightings) {
    const decade = Math.floor(s.year / 10) * 10;
    if (!decadeMap.has(decade))
      decadeMap.set(decade, { decade, total: 0, ...Object.fromEntries(topShapeNames.map((n) => [n, 0])) });
    const d = decadeMap.get(decade);
    d.total++;
    if (topShapeNames.includes(s.shape)) d[s.shape]++;
  }
  const byDecade = [...decadeMap.values()].sort((a, b) => a.decade - b.decade);

  const durBuckets = [
    { label: '< 10s', max: 10, count: 0 }, { label: '10–30s', max: 30, count: 0 },
    { label: '30s–1m', max: 60, count: 0 }, { label: '1–5m', max: 300, count: 0 },
    { label: '5–15m', max: 900, count: 0 }, { label: '15m–1h', max: 3600, count: 0 },
    { label: '> 1h', max: Infinity, count: 0 },
  ];
  const durations = [];
  for (const s of sightings) {
    if (s.durationSec == null || s.durationSec <= 0) continue;
    durations.push(s.durationSec);
    for (const b of durBuckets) if (s.durationSec <= b.max) { b.count++; break; }
  }
  durations.sort((a, b) => a - b);
  const medianDuration = durations.length ? durations[Math.floor(durations.length / 2)] : null;

  const liveCount = sightings.filter((s) => s.source === 'nuforc-live').length;

  return {
    generatedAt: new Date().toISOString(),
    source: {
      name: 'National UFO Reporting Center (NUFORC)',
      via: 'live nuforc.org databank + planetsig/ufo-reports historical archive',
      url: 'https://nuforc.org',
    },
    total: sightings.length,
    liveReports: liveCount,
    firstReport: sightings[sightings.length - 1]?.datetime,
    lastReport: sightings[0]?.datetime,
    countries: byCountry.length,
    shapes: byShape.length,
    medianDurationSec: medianDuration,
    byShape, byCountry, byState, byCity, byYear, byMonth, byHour, byDow, byDecade,
    topShapeNames,
    durationBuckets: durBuckets.map(({ label, count }) => ({ label, count })),
  };
}

async function main() {
  const log = (s) => console.log(s);

  const baseline = await loadBaseline(log);

  // Live NUFORC fetch — strictly best-effort.
  let recent = [];
  if (process.env.UFO_SKIP_LIVE !== '1') {
    try {
      const geocode = buildGazetteer(baseline);
      recent = await fetchRecentNuforc(geocode, {
        sinceDays: Number(process.env.NUFORC_SINCE_DAYS) || 120,
        maxPages: Number(process.env.NUFORC_MAX_PAGES) || 8,
        log,
      });
    } catch (e) {
      log(`! NUFORC live fetch unavailable (${e.message}) — using snapshot only.`);
    }
  } else {
    log('• Live fetch skipped (UFO_SKIP_LIVE=1)');
  }

  const merged = recent.length ? mergeReports(baseline, recent, log) : baseline;
  // Strip the internal source tag is unnecessary — keep it; the type allows extra.
  const stats = aggregate(merged);

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(resolve(DATA_DIR, 'stats.json'), JSON.stringify(stats));
  writeFileSync(SIGHTINGS_FILE, JSON.stringify(merged));

  const mb = (n) => (n / 1e6).toFixed(1);
  log(`\n✓ Wrote src/data/stats.json`);
  log(`✓ Wrote src/data/sightings.json (${mb(JSON.stringify(merged).length)} MB, ${merged.length.toLocaleString()} records)`);
  log(`  Live NUFORC reports in set: ${stats.liveReports.toLocaleString()}`);
  log(`  Coverage: ${stats.firstReport} → ${stats.lastReport} across ${stats.countries} countries.`);
}

main().catch((err) => { console.error('✗ build-data failed:', err); process.exit(1); });
