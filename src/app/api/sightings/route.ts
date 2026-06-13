import { NextRequest, NextResponse } from 'next/server';
import { querySightings, mapPoints } from '@/lib/data';

// Query-driven, served from the in-memory bundled dataset.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const intOrUndef = (v: string | null) => {
    if (v == null || v === '') return undefined;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
  };

  const query = {
    search: p.get('search') || undefined,
    country: p.get('country') || undefined,
    state: p.get('state') || undefined,
    shape: p.get('shape') || undefined,
    yearFrom: intOrUndef(p.get('yearFrom')),
    yearTo: intOrUndef(p.get('yearTo')),
    limit: intOrUndef(p.get('limit')),
    offset: intOrUndef(p.get('offset')),
  };

  // Map mode: down-sampled lightweight points for the globe/map.
  if (p.get('map') === '1') {
    const max = intOrUndef(p.get('max')) ?? 3000;
    const points = mapPoints(query, Math.min(Math.max(max, 100), 8000));
    return NextResponse.json({ points });
  }

  return NextResponse.json(querySightings(query));
}
