'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Sighting, MapPoint } from '@/lib/types';
import { shapeColor, COUNTRY_NAMES, formatDuration } from '@/lib/types';

const SightingMap = dynamic(() => import('./SightingMap'), {
  ssr: false,
  loading: () => <div className="map-canvas map-loading">Loading map…</div>,
});

interface Props {
  shapes: string[];
  countries: { code: string; name: string }[];
  yearMin: number;
  yearMax: number;
}

const PAGE = 50;

export default function Explorer({ shapes, countries, yearMin, yearMax }: Props) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [country, setCountry] = useState('');
  const [shape, setShape] = useState('');
  const [yearFrom, setYearFrom] = useState<number | ''>('');
  const [yearTo, setYearTo] = useState<number | ''>('');

  const [results, setResults] = useState<Sighting[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<Sighting | null>(null);

  const reqId = useRef(0);

  // Debounce free-text search.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const paramsKey = useMemo(() => {
    const p = new URLSearchParams();
    if (debounced.trim()) p.set('search', debounced.trim());
    if (country) p.set('country', country);
    if (shape) p.set('shape', shape);
    if (yearFrom) p.set('yearFrom', String(yearFrom));
    if (yearTo) p.set('yearTo', String(yearTo));
    return p.toString();
  }, [debounced, country, shape, yearFrom, yearTo]);

  // Reset to the first page when filters change (state adjustment during render,
  // the React-recommended alternative to a reset effect).
  const [filterKey, setFilterKey] = useState(paramsKey);
  if (paramsKey !== filterKey) {
    setFilterKey(paramsKey);
    setOffset(0);
  }

  const fetchKey = `${paramsKey}|${offset}`;
  const loading = loadedKey !== fetchKey;

  // Fetch the list page. Loading is derived, so no synchronous setState here.
  useEffect(() => {
    const id = ++reqId.current;
    const p = new URLSearchParams(paramsKey);
    p.set('limit', String(PAGE));
    p.set('offset', String(offset));
    fetch(`/api/sightings?${p.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (id !== reqId.current) return;
        setResults(data.results || []);
        setTotal(data.total || 0);
        setLoadedKey(`${paramsKey}|${offset}`);
      })
      .catch(() => { if (id === reqId.current) setLoadedKey(`${paramsKey}|${offset}`); });
  }, [paramsKey, offset]);

  // Fetch map points (independent of pagination).
  useEffect(() => {
    const p = new URLSearchParams(paramsKey);
    p.set('map', '1');
    p.set('max', '3500');
    fetch(`/api/sightings?${p.toString()}`)
      .then((r) => r.json())
      .then((data) => setPoints(data.points || []))
      .catch(() => {});
  }, [paramsKey]);

  const reset = useCallback(() => {
    setSearch(''); setCountry(''); setShape(''); setYearFrom(''); setYearTo('');
  }, []);

  const page = Math.floor(offset / PAGE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const hasFilters = !!(debounced || country || shape || yearFrom || yearTo);

  return (
    <div className="explorer">
      <div className="filters">
        <input
          className="filter-input"
          placeholder="Search city, shape or report text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <select className="filter-select" value={shape} onChange={(e) => setShape(e.target.value)}>
          <option value="">All shapes</option>
          {shapes.map((s) => (
            <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
          ))}
        </select>
        <input
          className="filter-year" type="number" min={yearMin} max={yearMax}
          placeholder={`${yearMin}`} value={yearFrom}
          onChange={(e) => setYearFrom(e.target.value ? +e.target.value : '')}
        />
        <span className="filter-dash">–</span>
        <input
          className="filter-year" type="number" min={yearMin} max={yearMax}
          placeholder={`${yearMax}`} value={yearTo}
          onChange={(e) => setYearTo(e.target.value ? +e.target.value : '')}
        />
        {hasFilters && <button className="filter-reset" onClick={reset}>Clear</button>}
      </div>

      <div className="explorer-count">
        {loading ? 'Searching…' : `${total.toLocaleString()} matching reports`}
        <span className="explorer-hint"> · map shows up to 3,500 plotted points</span>
      </div>

      <div className="map-wrap">
        <SightingMap points={points} />
      </div>

      <div className="results">
        {results.map((s, i) => (
          <button key={`${s.datetime}-${i}`} className="result-row" onClick={() => setSelected(s)}>
            <span className="result-dot" style={{ background: shapeColor(s.shape) }} />
            <span className="result-place">
              {s.city}
              {s.state && `, ${s.state.toUpperCase()}`}
              <span className="result-country">{COUNTRY_NAMES[s.country] || s.country.toUpperCase()}</span>
            </span>
            <span className="result-shape">{s.shape}</span>
            <span className="result-date">{new Date(s.datetime).toLocaleDateString()}</span>
          </button>
        ))}
        {!loading && results.length === 0 && (
          <div className="result-empty">No reports match these filters.</div>
        )}
      </div>

      {pages > 1 && (
        <div className="pager">
          <button disabled={page <= 1} onClick={() => setOffset(Math.max(0, offset - PAGE))}>← Prev</button>
          <span>Page {page.toLocaleString()} of {pages.toLocaleString()}</span>
          <button disabled={page >= pages} onClick={() => setOffset(offset + PAGE)}>Next →</button>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                {selected.city}
                {selected.state && `, ${selected.state.toUpperCase()}`}
                {' · '}{COUNTRY_NAMES[selected.country] || selected.country.toUpperCase()}
              </h3>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-meta">
              <span className="badge" style={{ background: `${shapeColor(selected.shape)}22`, color: shapeColor(selected.shape) }}>
                {selected.shape}
              </span>
              <span>{new Date(selected.datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              <span>Duration: {selected.duration || formatDuration(selected.durationSec)}</span>
            </div>
            <p className="modal-summary">{selected.summary || 'No description provided.'}</p>
            <a
              className="modal-link"
              href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
              target="_blank" rel="noreferrer"
            >
              {selected.lat.toFixed(3)}, {selected.lng.toFixed(3)} ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
