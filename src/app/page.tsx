'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getRecentSightings, UFOSighting } from '@/lib/ufo-api';

const SightingMap = dynamic(() => import('@/components/SightingMap'), { ssr: false });

export default function Home() {
  const [sightings, setSightings] = useState<UFOSighting[]>([]);
  const [loading, setLoading] = useState(true);

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
      <StarsBackground />

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 20, padding: '1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem', animation: 'float 3s ease-in-out infinite' }}>🛸</span>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, textShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}>UFO Tracker</h1>
              <p style={{ fontSize: '0.875rem', color: '#a855f7', margin: 0 }}>Real-time global sightings</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
              <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
              {sightings.length} reports
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
              
              {/* Map */}
              <div style={{ 
                background: 'rgba(17, 24, 39, 0.7)', 
                borderRadius: '1rem', 
                overflow: 'hidden',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxShadow: '0 0 40px rgba(168, 85, 247, 0.1)'
              }}>
                <SightingMap sightings={sightings} />
              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Stats */}
                <div style={{ background: 'rgba(17, 24, 39, 0.8)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📊</span> Statistics
                  </h3>
                  
                  <div style={{ 
                    textAlign: 'center', 
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(59, 130, 246, 0.2))', 
                    borderRadius: '0.75rem', 
                    padding: '1rem', 
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {sightings.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sightings</div>
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Top Shapes</h4>
                    {topShapes.map(([shape, count], i) => (
                      <div key={shape} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ width: '1rem', fontSize: '0.7rem', color: '#6b7280' }}>{i + 1}</span>
                        <span style={{ flex: 1, fontSize: '0.8rem', color: '#e5e7eb' }}>{shape}</span>
                        <span style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: 500 }}>{count}</span>
                        <div style={{ width: '50px', height: '3px', background: '#374151', borderRadius: '2px' }}>
                          <div style={{ width: `${(count / sightings.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #a855f7, #3b82f6)', borderRadius: '2px', transition: 'width 0.5s ease' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Hotspots</h4>
                    {topCountries.map(([country, count], i) => (
                      <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ width: '1rem', fontSize: '0.7rem', color: '#6b7280' }}>{i + 1}</span>
                        <span style={{ flex: 1, fontSize: '0.8rem', color: '#e5e7eb' }}>{country}</span>
                        <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 500 }}>{count}</span>
                        <div style={{ width: '50px', height: '3px', background: '#374151', borderRadius: '2px' }}>
                          <div style={{ width: `${(count / sightings.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #10b981)', borderRadius: '2px', transition: 'width 0.5s ease' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent List */}
                <div style={{ flex: 1, background: 'rgba(17, 24, 39, 0.8)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(168, 85, 247, 0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📋</span> Recent
                  </h3>
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {sightings.slice(0, 12).map(s => (
                      <div key={s.id} style={{ 
                        padding: '0.75rem', 
                        marginBottom: '0.5rem', 
                        background: 'rgba(31, 41, 55, 0.5)', 
                        borderRadius: '0.5rem',
                        border: '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{s.city}, {s.country}</span>
                          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{new Date(s.datetime).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#a855f7' }}>{s.shape}</span>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{s.duration}</span>
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

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </main>
  );
}

function StarsBackground() {
  const [stars, setStars] = useState<{ id: number; left: number; top: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    setStars(Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3
    })));
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {stars.map(star => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: 'white',
            borderRadius: '50%',
            animation: `twinkle ${3 + Math.random() * 2}s infinite ease-in-out`,
            animationDelay: `${star.delay}s`
          }}
        />
      ))}
    </div>
  );
}
