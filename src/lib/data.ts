// src/lib/data.ts
// Server-only data access over the full NUFORC record set.
// The 24MB dataset is imported once (traced into the standalone build) and
// kept in module memory; route handlers query it without re-parsing per call.
// NOTE: only import this module from server code (route handlers / server
// components) — it pulls in the full 24MB dataset.
import sightingsData from '@/data/sightings.json';
import statsData from '@/data/stats.json';
import type { Sighting, Stats, MapPoint } from './types';

const ALL: Sighting[] = sightingsData as Sighting[];

export function getStats(): Stats {
  return statsData as Stats;
}

export interface Query {
  search?: string;
  country?: string;
  state?: string;
  shape?: string;
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  offset?: number;
}

export interface QueryResult {
  total: number; // total matching the filters
  offset: number;
  limit: number;
  results: Sighting[];
}

function matches(s: Sighting, q: Query, searchLc?: string): boolean {
  if (q.country && s.country !== q.country) return false;
  if (q.state && s.state !== q.state) return false;
  if (q.shape && s.shape !== q.shape) return false;
  if (q.yearFrom && s.year < q.yearFrom) return false;
  if (q.yearTo && s.year > q.yearTo) return false;
  if (searchLc) {
    const hay = `${s.city} ${s.summary} ${s.shape} ${s.country} ${s.state}`.toLowerCase();
    if (!hay.includes(searchLc)) return false;
  }
  return true;
}

export function querySightings(q: Query): QueryResult {
  const limit = Math.min(Math.max(q.limit ?? 50, 1), 500);
  const offset = Math.max(q.offset ?? 0, 0);
  const searchLc = q.search?.trim().toLowerCase() || undefined;

  const matched: Sighting[] = [];
  for (const s of ALL) {
    if (matches(s, q, searchLc)) matched.push(s);
  }
  // ALL is pre-sorted newest-first; preserve that order.
  return {
    total: matched.length,
    offset,
    limit,
    results: matched.slice(offset, offset + limit),
  };
}

// Evenly down-sample matching records to ~`max` points for the map so we never
// ship 80k markers to the browser, while still covering the full time/space range.
export function mapPoints(q: Query, max = 3000): MapPoint[] {
  const searchLc = q.search?.trim().toLowerCase() || undefined;
  const matched: Sighting[] = [];
  for (const s of ALL) {
    if (matches(s, q, searchLc)) matched.push(s);
  }
  const step = matched.length > max ? Math.ceil(matched.length / max) : 1;
  const out: MapPoint[] = [];
  for (let i = 0; i < matched.length; i += step) {
    const s = matched[i];
    out.push({
      lat: s.lat,
      lng: s.lng,
      shape: s.shape,
      city: s.city,
      country: s.country,
      datetime: s.datetime,
      duration: s.duration,
      summary: s.summary,
    });
  }
  return out;
}
