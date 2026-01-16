'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getRecentSightings, UFOSighting } from '@/lib/ufo-api';

// Dynamic import for globe (no SSR)
const UFOGlobe = dynamic(() => import('@/components/UFOGlobe'), { ssr: false });
const SightingsList = dynamic(() => import('@/components/SightingsList'), { ssr: false });
const StatsPanel = dynamic(() => import('@/components/StatsPanel'), { ssr: false });

export default function Home() {
  const [sightings, setSightings] = useState<UFOSighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

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

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated Stars Background */}
      <StarsBackground />
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-4xl animate-pulse">🛸</div>
            <div>
              <h1 className="text-2xl font-bold text-white glow-text">
                UFO Tracker
              </h1>
              <p className="text-sm text-purple-400">
                Real-time global sightings
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Data
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showStats
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-6 px-6 h-screen">
        <div className="max-w-7xl mx-auto h-full flex gap-6">
          
          {/* Globe - Takes most of the screen */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="w-full h-full rounded-2xl bg-gray-900/50 flex items-center justify-center glass-card">
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-bounce">🛸</div>
                  <p className="text-white text-lg">Scanning for UFOs<span className="loading-dots">.</span></p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl overflow-hidden glass-card gradient-border">
                <UFOGlobe sightings={sightings} />
              </div>
            )}
            
            {/* Bottom Info Bar */}
            {!loading && (
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  <span>🖱️ Drag to rotate • Scroll to zoom</span>
                  <span>•</span>
                  <span>Click points for details</span>
                </div>
                <div>
                  Data: NUFORC + Global Reports
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-80 flex flex-col gap-4">
            {showStats && <StatsPanel sightings={sightings} />}
            <div className="flex-1 min-h-0">
              <SightingsList sightings={sightings} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 p-4 text-center text-sm text-gray-500">
        <p>🛸 Tracking the unexplained since 2025</p>
      </footer>
    </main>
  );
}

// Stars background component
function StarsBackground() {
  const [stars, setStars] = useState<{ id: number; left: number; top: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate random stars
    const newStars = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="stars">
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`
          }}
        />
      ))}
    </div>
  );
}
