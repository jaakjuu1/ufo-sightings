// src/lib/nuforc.ts
// Server-only: fetches the *latest* reports straight from nuforc.org for the
// live "freshest reports" strip. This is a small, list-only counterpart to the
// full merge pipeline in scripts/sources/nuforc.mjs (which also geocodes and
// aggregates for the committed snapshot).
//
// Best-effort by design: if nuforc.org is outside the deploy environment's
// egress allowlist (the common case), every call here fails quietly and the UI
// simply hides the live strip. Add nuforc.org to the allowlist to switch it on.
import * as cheerio from 'cheerio';

const BASE = 'https://nuforc.org';
const INDEX_URL = `${BASE}/ndx/?id=post`; // by posting date → newest additions first
const UA = 'Mozilla/5.0 (compatible; ufo-sightings-atlas/1.0)';

export interface LiveReport {
  datetime: string;
  city: string;
  state: string;
  country: string;
  shape: string;
  summary: string;
  link: string;
}

function decode(s: string): string {
  return (s || '')
    .replace(/&#0?44;?/g, ',').replace(/&#0?39;?/g, "'").replace(/&quot;?/g, '"')
    .replace(/&amp;?/g, '&').replace(/&nbsp;?/g, ' ').replace(/\s+/g, ' ').trim();
}

const COUNTRY_TO_CODE: Record<string, string> = {
  usa: 'us', us: 'us', 'united states': 'us', canada: 'ca', 'united kingdom': 'gb',
  uk: 'gb', england: 'gb', scotland: 'gb', wales: 'gb', australia: 'au', germany: 'de',
};
function normCountry(raw: string): string {
  const c = (raw || '').trim().toLowerCase();
  if (!c) return '';
  return COUNTRY_TO_CODE[c] || (c.length === 2 ? c : c.slice(0, 2));
}

function parseDate(raw: string): string | null {
  const s = (raw || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (m) {
    const [, y, mo, d, h, mi] = m;
    return `${y}-${mo}-${d}T${(h || '0').padStart(2, '0')}:${mi || '00'}`;
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const [, mo, d, y, h, mi] = m;
    let yr = +y; if (yr < 100) yr += yr < 50 ? 2000 : 1900;
    return `${yr}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T${(h || '0').padStart(2, '0')}:${mi || '00'}`;
  }
  return null;
}

async function getHtml(url: string, revalidate: number): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    next: { revalidate },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Returns the newest reports, or [] if NUFORC is unreachable.
export async function fetchLatestReports(limit = 24, revalidate = 1800): Promise<LiveReport[]> {
  try {
    const $ = cheerio.load(await getHtml(INDEX_URL, revalidate));
    const links: string[] = [];
    $('tr td u a, tr td a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && /subndx|ndxp|\?id=/.test(href)) links.push(href);
    });
    if (links.length === 0) return [];

    const first = links[0].startsWith('http') ? links[0] : `${BASE}${links[0]}`;
    const $$ = cheerio.load(await getHtml(first, revalidate));

    const reports: LiveReport[] = [];
    $$('table tbody tr').each((_, tr) => {
      const tds = $$(tr).find('td');
      if (tds.length < 7) return;
      const datetime = parseDate(decode($$(tds[1]).text()));
      if (!datetime) return;
      const href = $$(tds[0]).find('a').attr('href') || '';
      reports.push({
        datetime,
        city: decode($$(tds[2]).text()) || 'Unknown',
        state: decode($$(tds[3]).text()).toLowerCase(),
        country: normCountry(decode($$(tds[4]).text())),
        shape: decode($$(tds[5]).text()).toLowerCase() || 'unknown',
        summary: decode($$(tds[6]).text()).slice(0, 220),
        link: href.startsWith('http') ? href : `${BASE}${href}`,
      });
    });
    reports.sort((a, b) => (a.datetime < b.datetime ? 1 : -1));
    return reports.slice(0, limit);
  } catch {
    return [];
  }
}
