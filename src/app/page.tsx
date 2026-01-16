'use client';

import { useState } from 'react';

interface UFOSighting {
  id: string;
  datetime: string;
  city: string;
  state: string;
  country: string;
  shape: string;
  duration: string;
  summary: string;
  lat: number;
  lng: number;
}

const DATA: UFOSighting[] = [
  { id: '1', datetime: '2025-01-10 22:30:00', city: 'Phoenix', state: 'AZ', country: 'USA', shape: 'Light', duration: '10 min', summary: 'Bright lights', lat: 33.4484, lng: -112.0740 },
  { id: '2', datetime: '2025-01-09 21:15:00', city: 'Los Angeles', state: 'CA', country: 'USA', shape: 'Circle', duration: '2 min', summary: 'Orange orb', lat: 34.0522, lng: -118.2437 },
  { id: '3', datetime: '2025-01-08 03:45:00', city: 'Chicago', state: 'IL', country: 'USA', shape: 'Triangle', duration: '5 min', summary: 'Black triangle', lat: 41.8781, lng: -87.6298 },
  { id: '4', datetime: '2025-01-07 19:20:00', city: 'London', state: '', country: 'UK', shape: 'Sphere', duration: '3 min', summary: 'Silver sphere', lat: 51.5074, lng: -0.1278 },
  { id: '5', datetime: '2025-01-06 23:00:00', city: 'Tokyo', state: '', country: 'Japan', shape: 'Cigar', duration: '8 min', summary: 'Elongated craft', lat: 35.6762, lng: 139.6503 },
  { id: '6', datetime: '2025-01-05 02:30:00', city: 'Denver', state: 'CO', country: 'USA', shape: 'Fireball', duration: '1 min', summary: 'Green fireball', lat: 39.7392, lng: -104.9903 },
  { id: '7', datetime: '2025-01-04 20:15:00', city: 'Seattle', state: 'WA', country: 'USA', shape: 'Disk', duration: '4 min', summary: 'Classic saucer', lat: 47.6062, lng: -122.3321 },
  { id: '8', datetime: '2025-01-03 18:45:00', city: 'Sydney', state: 'NSW', country: 'Australia', shape: 'Triangle', duration: '6 min', summary: 'Three lights', lat: -33.8688, lng: 151.2093 },
  { id: '9', datetime: '2025-01-02 22:00:00', city: 'New York', state: 'NY', country: 'USA', shape: 'Chevron', duration: '2 min', summary: 'Crescent-shaped', lat: 40.7128, lng: -74.0060 },
  { id: '10', datetime: '2025-01-01 01:30:00', city: 'Mexico City', state: '', country: 'Mexico', shape: 'Oval', duration: '7 min', summary: 'Huge oval', lat: 19.4326, lng: -99.1332 },
  { id: '11', datetime: '2024-12-31 23:45:00', city: 'Paris', state: '', country: 'France', shape: 'Light', duration: '3 min', summary: 'Multiple lights', lat: 48.8566, lng: 2.3522 },
  { id: '12', datetime: '2024-12-30 21:20:00', city: 'Miami', state: 'FL', country: 'USA', shape: 'Rectangle', duration: '5 min', summary: 'Flat rectangular', lat: 25.7617, lng: -80.1918 },
  { id: '13', datetime: '2024-12-29 02:10:00', city: 'Las Vegas', state: 'NV', country: 'USA', shape: 'Sphere', duration: '15 min', summary: 'Cluster of orbs', lat: 36.1699, lng: -115.1398 },
  { id: '14', datetime: '2024-12-28 19:50:00', city: 'Toronto', state: 'ON', country: 'Canada', shape: 'Cylinder', duration: '4 min', summary: 'Metallic cylinder', lat: 43.6532, lng: -79.3832 },
  { id: '15', datetime: '2024-12-27 20:30:00', city: 'Berlin', state: '', country: 'Germany', shape: 'Diamond', duration: '2 min', summary: 'Diamond pulsing', lat: 52.5200, lng: 13.4050 },
];

export default function Home() {
  const sightings = DATA;
  
  const topShapes = Object.entries(
    sightings.reduce((acc, s) => { acc[s.shape] = (acc[s.shape] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const countries = Object.entries(
    sightings.reduce((acc, s) => { acc[s.country] = (acc[s.country] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recent = [...sightings].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050510', color: '#fff', padding: '16px', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #222', paddingBottom: '16px' }}>
        <span style={{ fontSize: '24px' }}>🛸</span>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>UFO Tracker</h1>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{sightings.length} reports</p>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '28px', color: '#a855f7', fontWeight: 'bold' }}>{sightings.length}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Sightings</div>
          </div>
          <div style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '28px', color: '#22c55e', fontWeight: 'bold' }}>{new Set(sightings.map(s => s.country)).size}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Countries</div>
          </div>
        </div>

        {/* Top Shapes */}
        <div style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '14px', marginBottom: '12px', color: '#ccc' }}>Most Common Shapes</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {topShapes.map(([shape, count]) => (
              <span key={shape} style={{ backgroundColor: '#1a1a2e', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid #333' }}>
                {shape} <span style={{ color: '#a855f7' }}>{count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Hotspots */}
        <div style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '14px', marginBottom: '12px', color: '#ccc' }}>Hotspots</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {countries.map(([country, count], i) => (
              <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '16px', fontSize: '11px', color: '#555' }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: '13px' }}>{country}</span>
                <span style={{ fontSize: '12px', color: '#22c55e' }}>{count}</span>
                <div style={{ width: '60px', height: '4px', backgroundColor: '#222', borderRadius: '2px' }}>
                  <div style={{ width: `${(count / sightings.length) * 100}%`, height: '100%', backgroundColor: '#22c55e', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '14px', marginBottom: '12px', color: '#ccc' }}>Recent Reports</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recent.slice(0, 12).map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: '#1a1a2e', borderRadius: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getShapeColor(s.shape), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.city}, {s.country}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>{new Date(s.datetime).toLocaleDateString()}</div>
                </div>
                <span style={{ fontSize: '11px', color: '#888', flexShrink: 0 }}>{s.shape}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', paddingTop: '32px', color: '#333', fontSize: '12px' }}>
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
