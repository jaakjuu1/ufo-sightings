'use client';

import React, { useEffect, useState } from 'react';
import { getRecentSightings, UFOSighting } from '@/lib/ufo-api';

export default function Home() {
  const [sightings, setSightings] = useState<UFOSighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('list');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getRecentSightings(50);
        setSightings(data);
      } catch (error) {
        console.error('Failed to load sightings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const topShapes = Object.entries(
    sightings.reduce((acc, s) => { acc[s.shape] = (acc[s.shape] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const topCountries = Object.entries(
    sightings.reduce((acc, s) => { acc[s.country] = (acc[s.country] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Animated Stars */}
      <div className="stars" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              background: 'white',
              borderRadius: '50%',
              animation: `twinkle ${3 + Math.random() * 2}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 20, padding: '1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem' }}>🛸</span>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>UFO Tracker</h1>
              <p style={{ fontSize: '0.875rem', color: '#a855f7', margin: 0 }}>Real-time global sightings</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
              <span style={{ width: '0.5rem', height: '0.5rem', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
              Live Data
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 10, padding: '0 1.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {loading ? (
            <div style={{ height: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounce 1s infinite' }}>🛸</div>
                <p style={{ fontSize: '1.125rem' }}>Scanning for UFOs...</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
              
              {/* Map Section */}
              <div style={{ background: 'rgba(17, 24, 39, 0.7)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>🗺️ Recent Sightings Map</h2>
                
                {/* Simple 2D world map using dots */}
                <div style={{ 
                  background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #0f0a1e 100%)',
                  borderRadius: '0.75rem',
                  height: '400px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Simplified world outline */}
                  <svg viewBox="0 0 1000 500" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                    {/* North America */}
                    <path d="M150,120 Q200,100 250,110 L280,150 Q300,180 280,220 L200,280 Q150,260 120,200 Z" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.5"/>
                    {/* South America */}
                    <path d="M220,300 Q250,290 270,310 L280,380 Q260,420 230,400 Z" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.5"/>
                    {/* Europe */}
                    <path d="M480,100 Q520,90 550,110 L560,150 Q540,170 500,160 Z" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.5"/>
                    {/* Africa */}
                    <path d="M480,180 Q520,170 550,200 L560,300 Q530,350 490,320 Z" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.5"/>
                    {/* Asia */}
                    <path d="M600,100 Q700,80 800,120 L850,200 Q800,250 700,220 L620,180 Z" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.5"/>
                    {/* Australia */}
                    <path d="M780,320 Q820,300 860,330 L850,370 Q820,390 780,360 Z" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.5"/>
                  </svg>
                  
                  {/* Sightings dots */}
                  {sightings.map((s, i) => (
                    <div
                      key={s.id}
                      style={{
                        position: 'absolute',
                        left: `${((s.lng + 180) / 360) * 100}%`,
                        top: `${((90 - s.lat) / 180) * 100}%`,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: getShapeColor(s.shape),
                        transform: 'translate(-50%, -50%)',
                        animation: `pulse 2s infinite ${i * 0.1}s`,
                        cursor: 'pointer',
                        boxShadow: `0 0 10px ${getShapeColor(s.shape)}`
                      }}
                      title={`${s.city}, ${s.country} - ${s.shape}`}
                    />
                  ))}
                </div>
                
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.75rem' }}>
                  🖱️ Click markers for details • Drag to pan
                </p>
              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Stats Card */}
                <div style={{ background: 'rgba(17, 24, 39, 0.7)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>📊 Statistics</h3>
                  <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{sightings.length}</div>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Total Sightings</div>
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Top Shapes</h4>
                    {topShapes.map(([shape, count], i) => (
                      <div key={shape} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ width: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>{i + 1}.</span>
                        <span style={{ flex: 1, fontSize: '0.875rem' }}>{shape}</span>
                        <span style={{ color: '#a855f7', fontSize: '0.875rem' }}>{count}</span>
                        <div style={{ width: '60px', height: '4px', background: '#374151', borderRadius: '2px' }}>
                          <div style={{ width: `${(count / sightings.length) * 100}%`, height: '100%', background: '#a855f7', borderRadius: '2px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Sightings List */}
                <div style={{ flex: 1, background: 'rgba(17, 24, 39, 0.7)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>📋 Recent Sightings</h3>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {sightings.slice(0, 15).map(s => (
                      <div key={s.id} style={{ padding: '0.75rem', marginBottom: '0.5rem', background: 'rgba(31, 41, 55, 0.5)', borderRadius: '0.5rem', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 500 }}>{s.city}, {s.country}</span>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(s.datetime).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', color: '#a855f7' }}>{s.shape}</span>
                          <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{s.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 20, padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
        🛸 Tracking the unexplained since 2025
      </footer>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.3); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </main>
  );
}

function getShapeColor(shape: string): string {
  const colors: Record<string, string> = {
    'Light': '#ffff00', 'Circle': '#ef4444', 'Triangle': '#22d3ee',
    'Sphere': '#a855f7', 'Cigar': '#f97316', 'Fireball': '#dc2626',
    'Disk': '#06b6d4', 'Chevron': '#8b5cf6', 'Oval': '#ec4899',
    'Rectangle': '#14b8a6', 'Orb': '#f472b6', 'Cylinder': '#64748b',
    'Diamond': '#f59e0b', 'Cone': '#84cc16'
  };
  return colors[shape] || '#ffffff';
}
