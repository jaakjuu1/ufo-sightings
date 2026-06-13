'use client';

import React, { useEffect, useState } from 'react';
import { shapeColor, COUNTRY_NAMES } from '@/lib/types';

interface LiveReport {
  datetime: string;
  city: string;
  state: string;
  country: string;
  shape: string;
  summary: string;
  link: string;
}

// Shows the freshest reports pulled live from nuforc.org. If the deploy
// environment can't reach NUFORC (host not allowlisted), the endpoint returns
// nothing and this component renders nothing — the rest of the page is unaffected.
export default function LiveFeed() {
  const [reports, setReports] = useState<LiveReport[] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/live')
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setReports(d.reports || []);
        setFetchedAt(d.fetchedAt || null);
      })
      .catch(() => alive && setReports([]));
    return () => { alive = false; };
  }, []);

  if (reports === null) {
    return (
      <section className="card live-panel">
        <div className="live-head">
          <span className="live-dot" /> <span className="live-title">Latest from NUFORC</span>
          <span className="live-status">checking live feed…</span>
        </div>
      </section>
    );
  }

  if (reports.length === 0) return null; // live source not reachable — stay quiet

  return (
    <section className="card live-panel">
      <div className="live-head">
        <span className="live-dot live-dot-on" />
        <span className="live-title">Latest from NUFORC — live</span>
        {fetchedAt && (
          <span className="live-status">updated {new Date(fetchedAt).toLocaleString()}</span>
        )}
      </div>
      <div className="live-scroll">
        {reports.map((r, i) => (
          <a
            key={i}
            className="live-card"
            href={r.link}
            target="_blank"
            rel="noreferrer"
            title={r.summary}
          >
            <div className="live-card-top">
              <span className="live-shape-dot" style={{ background: shapeColor(r.shape) }} />
              <span className="live-place">
                {r.city}{r.state && `, ${r.state.toUpperCase()}`}
              </span>
            </div>
            <div className="live-meta">
              {new Date(r.datetime).toLocaleDateString()} · <span style={{ textTransform: 'capitalize' }}>{r.shape}</span>
              {r.country && ` · ${COUNTRY_NAMES[r.country] || r.country.toUpperCase()}`}
            </div>
            <div className="live-summary">{r.summary}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
