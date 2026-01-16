'use client';

import React, { useRef, useState, useEffect } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { UFOSighting } from '@/lib/ufo-api';

interface UFOGlobeProps {
  sightings: UFOSighting[];
}

const UFOGlobe: React.FC<UFOGlobeProps> = ({ sightings }) => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('globe-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.3;
      globeEl.current.pointOfView({ lat: 20, lng: -50, altitude: 2.5 }, 2000);
    }
  }, []);

  // Convert sightings to globe points
  const points = sightings.map(sighting => ({
    lat: sighting.lat,
    lng: sighting.lng,
    size: 0.5 + Math.random() * 1.5,
    color: getColorByShape(sighting.shape),
    sighting: sighting
  }));

  function getColorByShape(shape: string): string {
    const colors: { [key: string]: string } = {
      'Light': '#ffff00',
      'Circle': '#ff6b6b',
      'Triangle': '#4ecdc4',
      'Sphere': '#a855f7',
      'Cigar': '#f97316',
      'Fireball': '#ef4444',
      'Disk': '#06b6d4',
      'Chevron': '#8b5cf6',
      'Oval': '#ec4899',
      'Rectangle': '#14b8a6',
      'Orb': '#f472b6',
      'Cylinder': '#64748b',
      'Diamond': '#f59e0b',
      'Cone': '#84cc16'
    };
    return colors[shape] || '#ffffff';
  }

  return (
    <div id="globe-container" style={{ width: '100%', height: '100%' }}>
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Points for UFO sightings
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.05}
        pointRadius="size"
        pointsMerge={true}
        
        // Labels
        labelsData={points}
        labelLat="lat"
        labelLng="lng"
        labelText={(d: any) => `${d.sighting.city}, ${d.sighting.country}`}
        labelSize={1.2}
        labelDotRadius={0.5}
        labelColor={() => 'rgba(255, 255, 255, 0.9)'}
        labelResolution={2}
        
        // Atmosphere
        atmosphereColor="#4a90d9"
        atmosphereAltitude={0.15}
        
        // Polygon outlines
        polygonsData={[]}
      />
    </div>
  );
};

export default UFOGlobe;
