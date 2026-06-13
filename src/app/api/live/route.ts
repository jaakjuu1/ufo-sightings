import { NextResponse } from 'next/server';
import { fetchLatestReports } from '@/lib/nuforc';

// Revalidated on the server (ISR): the live NUFORC fetch happens at most once
// per window and is shared across visitors.
export const revalidate = 1800; // 30 minutes

export async function GET() {
  const reports = await fetchLatestReports(24, revalidate);
  return NextResponse.json(
    { available: reports.length > 0, fetchedAt: new Date().toISOString(), reports },
    { headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' } },
  );
}
