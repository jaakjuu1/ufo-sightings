'use client';

import React, { useEffect, useState } from 'react';
import { getRecentSightings, UFOSighting } from '@/lib/ufo-api';

export default function Home() {
  const [sightings, setSightings] = useState<UFOSighting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentSightings(50).then(data => {
      setSightings(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const topShapes = Object.entries(
    sightings.reduce((acc, s) => { acc[s.shape] = (acc[s.shape] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const countries = Object.entries(
    sightings.reduce((acc, s) => { acc[s.country] = (acc[s.country] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recent = [...sightings].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '16px', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #333', paddingBottom: '16px' }}>
        <span style={{ fontSize: '24px' }}>🛸</span>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>UFO Tracker</h1>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{sightings.length} reports</p>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛸</div>
          <p style={{ color: '#666' }}>Loading...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', color: '#a855f7', fontWeight: 'bold' }}>{sightings.length}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
            </div>
            <div style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', color: '#22c55e', fontWeight: 'bold' }}>{new Set(sightings.map(s => s.country)).size}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Countries</div>
            </div>
          </div>

          {/* Top Shapes */}
          <div style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '14px', marginBottom: '12px', color: '#ccc' }}>Most Common</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {topShapes.map(([shape, count]) => (
                <span key={shape} style={{ backgroundColor: '#222', padding: '6px 12px', borderRadius: '20px', fontSize: '12px' }}>
                  {shape} <span style={{ color: '#a855f7' }}>{count}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Recent */}
          <div style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '14px', marginBottom: '12px', color: '#ccc' }}>Recent</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recent.slice(0, 10).map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getShapeColor(s.shape) }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px' }}>{s.city}, {s.country}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{new Date(s.datetime).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#888' }}>{s.shape}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', paddingTop: '24px', color: '#444', fontSize: '12px' }}>
        🛸 UFO Tracker
      </footer>
    </div>
  );
}

function getShapeColor(shape: string): string {
  const colors: Record<string, string> = {
    'Light': '#fbbf24', 'Circle': '#f87171', 'Triangle': '#22d3ee',
    'Sphere': '#a78bfa', 'Cigar': '#fb923c', 'Fireball': '#ef4444',
    'Disk': '#06b6d4', 'Chevron': '#8b5cf6', 'Oval': '#f472b6',
    'Rectangle': '#14b8a6', 'Orb': '#f472b6', 'Cylinder': '#94a3b8',
    'Diamond': '#fbbf24', 'Cone': '#84cc16'
  };
  return colors[shape] || '#fff';
}
