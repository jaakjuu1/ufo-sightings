// scripts/sources/nuforc.mjs
//
// Fetches recent reports directly from the live NUFORC databank
// (https://nuforc.org) and normalizes them to our Sighting shape.
//
// Mirrors the HTML structure used by the maintained Scrapy scraper
// (timothyrenner/nuforc_sightings_data):
//   - Index   https://nuforc.org/ndx/?id=event  → <tr><td><u><a>DATE</a> links
//   - Sub-idx <table><tbody><tr> rows, tds: [0]=report link, [1]=event datetime,
//             [2]=city, [3]=state, [4]=country, [5]=shape, [6]=summary, [8]=posted
//
// NUFORC's host is often outside this sandbox's egress allowlist; callers MUST
// treat failures as non-fatal and fall back to the committed snapshot. The
// scheduled GitHub Action (open egress) is where this normally runs for real.
import * as cheerio from 'cheerio';

const BASE = 'https://nuforc.org';
const INDEX_URL = `${BASE}/ndx/?id=event`;
const UA =
  'Mozilla/5.0 (compatible; ufo-sightings-atlas/1.0; +https://github.com/jaakjuu1/ufo-sightings)';

async function getHtml(url, timeoutMs = 25000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function decode(s) {
  if (!s) return '';
  return s
    .replace(/&#0?44;?/g, ',')
    .replace(/&#0?39;?/g, "'")
    .replace(/&quot;?/g, '"')
    .replace(/&amp;?/g, '&')
    .replace(/&lt;?/g, '<')
    .replace(/&gt;?/g, '>')
    .replace(/&nbsp;?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Flexible parser: handles ISO, "M/D/YYYY HH:MM" and "M/D/YY HH:MM".
export function parseFlexibleDate(raw) {
  if (!raw) return null;
  const s = raw.trim();
  let m;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})/))) {
    const [, y, mo, d, h, mi] = m.map(Number);
    return mk(y, mo, d, h, mi);
  }
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    const [, y, mo, d] = m.map(Number);
    return mk(y, mo, d, 0, 0);
  }
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/))) {
    let [, mo, d, y, h, mi] = m.map((x) => (x == null ? undefined : Number(x)));
    if (y < 100) y += y < 50 ? 2000 : 1900;
    return mk(y, mo, d, h || 0, mi || 0);
  }
  return null;
}

function mk(y, mo, d, h, mi) {
  if (!y || y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

const COUNTRY_TO_CODE = {
  usa: 'us', us: 'us', 'united states': 'us',
  canada: 'ca', ca: 'ca',
  'united kingdom': 'gb', uk: 'gb', gb: 'gb', england: 'gb', scotland: 'gb', wales: 'gb',
  australia: 'au', au: 'au',
  germany: 'de', de: 'de',
};

function normCountry(raw) {
  const c = (raw || '').trim().toLowerCase();
  if (!c) return '';
  if (COUNTRY_TO_CODE[c]) return COUNTRY_TO_CODE[c];
  if (c.length === 2) return c;
  return c.slice(0, 2);
}

/**
 * @param {(rec:{city:string,state:string,country:string})=>{lat:number,lng:number}|null} geocode
 * @param {{sinceDays?:number, maxPages?:number, fetchDetail?:boolean, log?:(s:string)=>void}} opts
 * @returns {Promise<import('../build-data.mjs').RawSighting[]>}
 */
export async function fetchRecentNuforc(geocode, opts = {}) {
  const sinceDays = opts.sinceDays ?? 120;
  const maxPages = opts.maxPages ?? 8;
  const log = opts.log ?? (() => {});
  const cutoff = new Date(Date.now() - sinceDays * 86400_000);

  log(`↓ NUFORC index ${INDEX_URL} (last ${sinceDays} days)`);
  const indexHtml = await getHtml(INDEX_URL);
  const $ = cheerio.load(indexHtml);

  // Collect period links whose date >= cutoff, newest first.
  const links = [];
  $('tr td u a, tr td a').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    if (!href) return;
    const dt = parseFlexibleDate(text);
    if (!dt || dt < cutoff) return;
    links.push({ dt, href });
  });
  links.sort((a, b) => b.dt - a.dt);
  const pages = [...new Map(links.map((l) => [l.href, l])).values()].slice(0, maxPages);
  log(`  ${pages.length} index period(s) within window`);

  const out = [];
  let geocoded = 0;
  for (const page of pages) {
    const url = page.href.startsWith('http') ? page.href : `${BASE}${page.href}`;
    let html;
    try {
      html = await getHtml(url);
    } catch (e) {
      log(`  ! skip ${url}: ${e.message}`);
      continue;
    }
    const $$ = cheerio.load(html);
    $$('table tbody tr').each((_, tr) => {
      const tds = $$(tr).find('td');
      if (tds.length < 7) return;
      const dt = parseFlexibleDate(decode($$(tds[1]).text()));
      if (!dt || dt < cutoff) return;
      const city = decode($$(tds[2]).text());
      const state = decode($$(tds[3]).text()).toLowerCase();
      const country = normCountry(decode($$(tds[4]).text()));
      const shape = decode($$(tds[5]).text()).toLowerCase() || 'unknown';
      const summary = decode($$(tds[6]).text());

      const geo = geocode({ city, state, country });
      if (geo) geocoded++;

      out.push({
        datetime: dt.toISOString().slice(0, 16),
        year: dt.getUTCFullYear(),
        month: dt.getUTCMonth() + 1,
        hour: dt.getUTCHours(),
        dow: dt.getUTCDay(),
        city: city || 'Unknown',
        state,
        country,
        shape,
        durationSec: null,
        duration: '',
        summary: summary.slice(0, 280),
        lat: geo ? geo.lat : null,
        lng: geo ? geo.lng : null,
        source: 'nuforc-live',
      });
    });
  }

  log(`✓ NUFORC: ${out.length} recent reports (${geocoded} geocoded)`);
  return out;
}
