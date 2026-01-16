'use client';

import React from 'react';
import { UFOSighting } from '@/lib/ufo-api';

interface StatsPanelProps {
  sightings: UFOSighting[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ sightings }) => {
  const totalSightings = sightings.length;
  
  // Calculate top shapes
  const shapeCounts = sightings.reduce((acc, s) => {
    acc[s.shape] = (acc[s.shape] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  const topShapes = Object.entries(shapeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Calculate countries
  const countryCounts = sightings.reduce((acc, s) => {
    acc[s.country] = (acc[s.country] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-green-400">📊</span>
        Statistics
      </h3>
      
      {/* Total Count */}
      <div className="text-center mb-6 p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
        <div className="text-4xl font-bold text-white">{totalSightings}</div>
        <div className="text-sm text-gray-400">Total Sightings Tracked</div>
      </div>
      
      {/* Top Shapes */}
      <div className="mb-4">
        <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Most Common Shapes</h4>
        <div className="space-y-2">
          {topShapes.map(([shape, count], i) => (
            <div key={shape} className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-4">{i + 1}.</span>
              <span className="text-white text-sm flex-1">{shape}</span>
              <span className="text-purple-400 text-sm font-medium">{count}</span>
              <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(count / totalSightings) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Top Countries */}
      <div>
        <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Hotspots</h4>
        <div className="space-y-2">
          {topCountries.map(([country, count], i) => (
            <div key={country} className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-4">{i + 1}.</span>
              <span className="text-white text-sm flex-1">{country}</span>
              <span className="text-green-400 text-sm font-medium">{count}</span>
              <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${(count / totalSightings) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
