'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getRecentSightings, UFOSighting } from '@/lib/ufo-api';

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
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const countries = Object.entries(
    sightings.reduce((acc, s) => { acc[s.country] = (acc[s.country] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recentSightings = [...sightings].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  // Simple SVG world map projection
  const renderWorldMap = () => {
    const width = 600;
    const height = 300;
    
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Simplified world outline */}
        <rect width={width} height={height} fill="#0a0a1a" rx="12" />
        
        {/* Continents - simplified paths */}
        <g fill="#1a1a2e" opacity="0.8">
          {/* North America */}
          <path d="M90,60 Q140,40 180,55 L200,100 Q220,140 180,180 Q130,170 100,130 Z" />
          {/* South America */}
          <path d="M160,200 Q190,190 210,210 L220,270 Q200,300 170,280 Z" />
          {/* Europe */}
          <path d="M280,50 Q320,40 350,60 L360,100 Q340,120 300,110 Z" />
          {/* Africa */}
          <path d="M280,130 Q320,120 350,150 L360,230 Q330,270 290,240 Z" />
          {/* Asia */}
          <path d="M380,50 Q480,30 550,70 L580,130 Q530,160 450,140 L400,120 Z" />
          {/* Australia */}
          <path d="M520,230 Q550,210 580,240 L570,280 Q540,300 510,270 Z" />
        </g>
        
        {/* Sightings dots */}
        {sightings.map((s) => {
          const x = ((s.lng + 180) / 360) * width;
          const y = ((90 - s.lat) / 180) * height;
          return (
            <circle
              key={s.id}
              cx={x}
              cy={y}
              r={6}
              fill={getShapeColor(s.shape)}
              className="animate-pulse"
              style={{ animationDelay: `${Math.random() * 2}s` }}
            >
              <title>{s.city}, {s.country} - {s.shape}</title>
            </circle>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-x-hidden font-sans">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#050510] to-[#050510]" />
        {/* Stars */}
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
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
      <header className="relative z-10 px-4 py-4 border-b border-white/5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛸</span>
            <div>
              <h1 className="text-lg font-bold text-white">UFO Tracker</h1>
              <p className="text-xs text-gray-500">{sightings.length} reports</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 py-4 space-y-4">
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
            <div className="relative rounded-xl overflow-hidden border border-white/5 bg-[#0a0a1a]">
              {renderWorldMap()}
              <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
                🌍 {sightings.length} locations
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-2xl font-bold text-purple-400">{sightings.length}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-2xl font-bold text-blue-400">{new Set(sightings.map(s => s.country)).size}</p>
                <p className="text-xs text-gray-500">Countries</p>
              </div>
            </div>

            {/* Top Shapes */}
            <div className="bg-white/5 rounded-xl p-4">
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

            {/* Countries */}
            <div className="bg-white/5 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Hotspots</h2>
              <div className="space-y-2">
                {countries.map(([country, count], i) => (
                  <div key={country} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                    <span className="flex-1 text-sm">{country}</span>
                    <span className="text-xs text-green-400">{count}</span>
                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(count / sightings.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent */}
            <div className="bg-white/5 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Recent</h2>
              <div className="space-y-2">
                {recentSightings.slice(0, 8).map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getShapeColor(s.shape) }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{s.city}, {s.country}</p>
                      <p className="text-xs text-gray-500">{new Date(s.datetime).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-gray-500">{s.shape}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-gray-600">
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
  return colors[shape] || '#ffffff';
}
