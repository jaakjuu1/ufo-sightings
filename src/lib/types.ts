// src/lib/types.ts
// Shared, client-safe types and presentation helpers (no Node/fs imports here).

export interface Sighting {
  datetime: string; // ISO, minute precision (UTC of recorded local time)
  year: number;
  month: number; // 1-12
  hour: number; // 0-23
  dow: number; // 0 = Sunday
  city: string;
  state: string; // lowercase 2-letter (US/CA/AU) or ''
  country: string; // lowercase 2-letter
  shape: string;
  durationSec: number | null;
  duration: string;
  summary: string;
  lat: number;
  lng: number;
  source?: string; // provenance: 'planetsig' (historical) | 'nuforc-live'
}

export interface ShapeCount { shape: string; count: number }
export interface CountryCount { code: string; name: string; count: number }
export interface StateCount { code: string; name: string; count: number }
export interface CityCount { city: string; state: string; country: string; count: number }
export interface YearCount { year: number; count: number }
export interface MonthCount { month: number; count: number }
export interface HourCount { hour: number; count: number }
export interface DowCount { dow: number; count: number }
export interface DecadeRow { decade: number; total: number; [shape: string]: number }
export interface BucketCount { label: string; count: number }

export interface Stats {
  generatedAt: string;
  source: { name: string; via: string; url: string };
  total: number;
  liveReports?: number; // count merged in from the live NUFORC feed
  firstReport: string;
  lastReport: string;
  countries: number;
  shapes: number;
  medianDurationSec: number | null;
  byShape: ShapeCount[];
  byCountry: CountryCount[];
  byState: StateCount[];
  byCity: CityCount[];
  byYear: YearCount[];
  byMonth: MonthCount[];
  byHour: HourCount[];
  byDow: DowCount[];
  byDecade: DecadeRow[];
  topShapeNames: string[];
  durationBuckets: BucketCount[];
}

// A trimmed record for the interactive map.
export interface MapPoint {
  lat: number;
  lng: number;
  shape: string;
  city: string;
  country: string;
  datetime: string;
  duration: string;
  summary: string;
}

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const COUNTRY_NAMES: Record<string, string> = {
  us: 'United States',
  ca: 'Canada',
  gb: 'United Kingdom',
  au: 'Australia',
  de: 'Germany',
};

// Consistent color per reported shape, used by the map, legend and charts.
const SHAPE_COLORS: Record<string, string> = {
  light: '#fbbf24',
  triangle: '#22d3ee',
  circle: '#f87171',
  fireball: '#ef4444',
  sphere: '#a78bfa',
  disk: '#06b6d4',
  oval: '#f472b6',
  formation: '#34d399',
  cigar: '#fb923c',
  cylinder: '#94a3b8',
  diamond: '#facc15',
  chevron: '#8b5cf6',
  rectangle: '#14b8a6',
  flash: '#fde047',
  cone: '#84cc16',
  cross: '#fca5a5',
  egg: '#fbcfe8',
  teardrop: '#7dd3fc',
  changing: '#c084fc',
  unknown: '#6b7280',
  other: '#9ca3af',
};

export function shapeColor(shape: string): string {
  return SHAPE_COLORS[shape?.toLowerCase()] || '#a855f7';
}

// A short, plain-language description for each reported shape, plus a glyph.
// Surfaced in the "Field guide to shapes" glossary so newcomers know what
// witnesses mean by, say, "chevron" vs. "cigar".
export const SHAPE_INFO: Record<string, { icon: string; desc: string }> = {
  light: { icon: '🔆', desc: 'A point or glow of light with no discernible body — the single most common report.' },
  triangle: { icon: '🔺', desc: 'A triangular craft, often described as silent, dark, and surprisingly large.' },
  circle: { icon: '⚪', desc: 'A round object seen face-on; flatter ones are usually logged as disks.' },
  fireball: { icon: '🔥', desc: 'A burning, fast-moving ball of light — many turn out to be meteors or re-entries.' },
  sphere: { icon: '🔵', desc: 'A clearly three-dimensional ball, often metallic or glowing.' },
  disk: { icon: '🛸', desc: 'The classic "flying saucer" — a flattened, plate-like craft.' },
  oval: { icon: '🥚', desc: 'An elongated, egg- or ellipse-like outline; a stretched circle.' },
  formation: { icon: '✨', desc: 'Several lights or objects moving together in a coordinated pattern.' },
  cigar: { icon: '🚬', desc: 'A long, narrow, tube-shaped craft with no wings.' },
  cylinder: { icon: '🧴', desc: 'A rounded, can-like object, often seen end-on or tumbling.' },
  changing: { icon: '🌀', desc: 'An object reported to morph its shape during the sighting.' },
  flash: { icon: '⚡', desc: 'A brief, bright burst of light with no lasting form.' },
  rectangle: { icon: '▭', desc: 'A flat, box- or panel-like object with straight edges.' },
  diamond: { icon: '🔷', desc: 'A four-pointed, kite-like outline, often with lights at the corners.' },
  chevron: { icon: '⌄', desc: 'A shallow V or boomerang of lights, like an arrowhead.' },
  egg: { icon: '🥚', desc: 'A smooth, ovoid craft, rounder than a cigar and seamless.' },
  teardrop: { icon: '💧', desc: 'A rounded body tapering to a point, like a falling drop.' },
  cone: { icon: '🔺', desc: 'A pointed, ice-cream-cone profile, wide at one end.' },
  cross: { icon: '✝️', desc: 'An object with two perpendicular axes, like a plus sign.' },
  unknown: { icon: '❓', desc: 'The witness could not assign a familiar shape.' },
  other: { icon: '⬚', desc: 'A described form that fits none of the standard categories.' },
};

export function shapeInfo(shape: string): { icon: string; desc: string } {
  return (
    SHAPE_INFO[shape?.toLowerCase()] || {
      icon: '◌',
      desc: 'A rarely reported form with only a handful of accounts on record.',
    }
  );
}

export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDuration(sec: number | null): string {
  if (sec == null || sec <= 0) return '—';
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)} min`;
  if (sec < 86400) return `${(sec / 3600).toFixed(1)} h`;
  return `${(sec / 86400).toFixed(1)} d`;
}
