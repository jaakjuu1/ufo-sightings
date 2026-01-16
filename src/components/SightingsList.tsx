'use client';

import React, { useState } from 'react';
import { UFOSighting } from '@/lib/ufo-api';

interface SightingsListProps {
  sightings: UFOSighting[];
}

const SightingsList: React.FC<SightingsListProps> = ({ sightings }) => {
  const [selectedSighting, setSelectedSighting] = useState<UFOSighting | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'country'>('date');

  const filteredSightings = sightings
    .filter(s => 
      s.city.toLowerCase().includes(filter.toLowerCase()) ||
      s.country.toLowerCase().includes(filter.toLowerCase()) ||
      s.shape.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.datetime).getTime() - new Date(a.datetime).getTime();
      } else {
        return a.country.localeCompare(b.country);
      }
    });

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 h-full overflow-hidden flex flex-col">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-purple-400">👽</span>
        Latest Sightings
        <span className="text-sm font-normal text-gray-400 ml-auto">
          {filteredSightings.length} reported
        </span>
      </h2>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search location, shape..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:border-purple-500 focus:outline-none"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'country')}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:border-purple-500 focus:outline-none"
        >
          <option value="date">Latest</option>
          <option value="country">Country</option>
        </select>
      </div>

      {/* Sightings List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {filteredSightings.map(sighting => (
          <div
            key={sighting.id}
            onClick={() => setSelectedSighting(sighting)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
              selectedSighting?.id === sighting.id
                ? 'bg-purple-500/20 border-purple-500'
                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-white font-medium text-sm">
                {sighting.city}{sighting.state && `, ${sighting.state}`}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(sighting.datetime).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-purple-400 text-xs">
                {sighting.country}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                getShapeColor(sighting.shape)
              }`}>
                {sighting.shape}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Details Modal */}
      {selectedSighting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/30">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">
                {selectedSighting.city}, {selectedSighting.state || selectedSighting.country}
              </h3>
              <button
                onClick={() => setSelectedSighting(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Date:</span>
                <span className="text-white">
                  {new Date(selectedSighting.datetime).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Shape:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getShapeColor(selectedSighting.shape)}`}>
                  {selectedSighting.shape}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white">{selectedSighting.duration}</span>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Description:</p>
                <p className="text-white text-sm">{selectedSighting.summary}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getShapeColor(shape: string): string {
  const colors: { [key: string]: string } = {
    'Light': 'bg-yellow-500/20 text-yellow-400',
    'Circle': 'bg-red-500/20 text-red-400',
    'Triangle': 'bg-teal-500/20 text-teal-400',
    'Sphere': 'bg-purple-500/20 text-purple-400',
    'Cigar': 'bg-orange-500/20 text-orange-400',
    'Fireball': 'bg-red-600/20 text-red-500',
    'Disk': 'bg-cyan-500/20 text-cyan-400',
    'Chevron': 'bg-violet-500/20 text-violet-400',
    'Oval': 'bg-pink-500/20 text-pink-400',
    'Rectangle': 'bg-teal-600/20 text-teal-400',
    'Orb': 'bg-pink-400/20 text-pink-400',
    'Cylinder': 'bg-slate-500/20 text-slate-400',
    'Diamond': 'bg-amber-500/20 text-amber-400',
    'Cone': 'bg-lime-500/20 text-lime-400'
  };
  return colors[shape] || 'bg-gray-500/20 text-gray-400';
}

export default SightingsList;
