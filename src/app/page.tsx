'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getRecentSightings, UFOSighting } from '@/lib/ufo-api';

const Map = dynamic(() => import('@/components/SightingMap'), { ssr: false });

export default function Home() {
  const [sightings, setSightings] = useState<UFOSighting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getRecentSightings(50);
        setSightings(data);
      } catch (error) {
        console.error('Failed:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const topShapes = Object.entries(
    sightings.reduce((acc, s) => { acc[s.shape] = (acc[s.shape] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const recentSightings = [...sightings].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#050510] to-[#050510]" />
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="star absolute bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-float">🛸</span>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                UFO Tracker
              </h1>
              <p className="text-xs text-gray-500">{sightings.length} reports tracked</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl animate-bounce mb-2">🛸</div>
              <p className="text-gray-400">Scanning...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Map */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 h-64">
              <Map sightings={sightings} />
              <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded text-xs text-gray-400">
                {sightings.length} locations
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-2xl font-bold text-purple-400">{sightings.length}</p>
                <p className="text-xs text-gray-500">Total Sightings</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-2xl font-bold text-blue-400">{new Set(sightings.map(s => s.country)).size}</p>
                <p className="text-xs text-gray-500">Countries</p>
              </div>
            </div>

            {/* Top Shapes */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Most Common</h2>
              <div className="flex flex-wrap gap-2">
                {topShapes.map(([shape, count]) => (
                  <span
                    key={shape}
                    className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  >
                    {shape} <span className="text-purple-400">{count}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Sightings */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Recent Reports</h2>
              <div className="space-y-2">
                {recentSightings.slice(0, 10).map(s => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getShapeColor(s.shape) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.city}, {s.country}</p>
                      <p className="text-xs text-gray-500">{new Date(s.datetime).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-gray-400 px-2 py-1 rounded bg-white/5">
                      {s.shape}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-gray-600">
        🛸 UFO Tracker {new Date().getFullYear()}
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
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
  return colors[shape] || '#ffffff';
}
