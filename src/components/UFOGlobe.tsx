'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { UFOSighting } from '@/lib/ufo-api';

// Fallback component when WebGL fails
const FallbackGlobe: React.FC<{ sightings: UFOSighting[] }> = ({ sightings }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl">
      <div className="text-center">
        <div className="text-8xl mb-4 animate-pulse">🌍</div>
        <h3 className="text-white text-xl font-bold mb-2">UFO Sightings Map</h3>
        <p className="text-gray-400 text-sm mb-4">{sightings.length} sightings worldwide</p>
        
        {/* Simple list of top locations */}
        <div className="text-left bg-gray-800/50 rounded-lg p-4 max-w-xs mx-auto">
          <h4 className="text-purple-400 text-xs uppercase tracking-wider mb-2">Recent Sightings</h4>
          {sightings.slice(0, 5).map((s, i) => (
            <div key={i} className="flex justify-between text-sm text-gray-300 py-1">
              <span>{s.city}, {s.country}</span>
              <span className="text-purple-400">{s.shape}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading component
const GlobeLoader: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl">
    <div className="text-center">
      <div className="text-6xl mb-4 animate-bounce">🛸</div>
      <p className="text-white text-lg">Scanning for UFOs<span className="loading-dots">.</span></p>
    </div>
  </div>
);

const UFOGlobe: React.FC<{ sightings: UFOSighting[] }> = ({ sightings }) => {
  const [useFallback, setUseFallback] = useState(false);
  const [GlobeComponent, setGlobeComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Check for WebGL support
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) {
          setUseFallback(true);
          return;
        }
        // Also check for three.js availability
        if (typeof window !== 'undefined') {
          try {
            // Dynamic import of three to check if it works
            import('three').then(() => {
              import('react-globe.gl').then((mod) => {
                setGlobeComponent(() => mod.default);
              }).catch(() => {
                setUseFallback(true);
              });
            }).catch(() => {
              setUseFallback(true);
            });
          } catch (e) {
            setUseFallback(true);
          }
        }
      } catch (e) {
        setUseFallback(true);
      }
    };

    // Delay the check to ensure we're in browser
    if (typeof window !== 'undefined') {
      setTimeout(checkWebGL, 100);
    } else {
      setUseFallback(true);
    }
  }, []);

  if (useFallback) {
    return <FallbackGlobe sightings={sightings} />;
  }

  if (!GlobeComponent) {
    return <GlobeLoader />;
  }

  return (
    <Suspense fallback={<GlobeLoader />}>
      <GlobeWrapper sightings={sightings} />
    </Suspense>
  );
};

// Wrapper component that uses the actual Globe
const GlobeWrapper: React.FC<{ sightings: UFOSighting[] }> = ({ sightings }) => {
  const globeEl = useRef<any>(undefined);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [error, setError] = useState(false);

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
      try {
        globeEl.current.controls().autoRotate = true;
        globeEl.current.controls().autoRotateSpeed = 0.3;
        globeEl.current.pointOfView({ lat: 20, lng: -50, altitude: 2.5 }, 2000);
      } catch (e) {
        console.error('Globe init error:', e);
        setError(true);
      }
    }
  }, [globeEl.current]);

  if (error) {
    return <FallbackGlobe sightings={sightings} />;
  }

  const points = sightings.map(sighting => ({
    lat: sighting.lat,
    lng: sighting.lng,
    size: 0.5 + Math.random() * 1.5,
    color: getColorByShape(sighting.shape),
    sighting: sighting
  }));

  function getColorByShape(shape: string): string {
    const colors: { [key: string]: string } = {
      'Light': '#ffff00', 'Circle': '#ff6b6b', 'Triangle': '#4ecdc4',
      'Sphere': '#a855f7', 'Cigar': '#f97316', 'Fireball': '#ef4444',
      'Disk': '#06b6d4', 'Chevron': '#8b5cf6', 'Oval': '#ec4899',
      'Rectangle': '#14b8a6', 'Orb': '#f472b6', 'Cylinder': '#64748b',
      'Diamond': '#f59e0b', 'Cone': '#84cc16'
    };
    return colors[shape] || '#ffffff';
  }

  const Globe = React.lazy(() => import('react-globe.gl'));

  return (
    <div id="globe-container" style={{ width: '100%', height: '100%' }}>
      <Suspense fallback={<GlobeLoader />}>
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.05}
          pointRadius="size"
          pointsMerge={true}
          labelsData={points}
          labelLat="lat"
          labelLng="lng"
          labelText={(d: any) => `${d.sighting.city}, ${d.sighting.country}`}
          labelSize={1.2}
          labelDotRadius={0.5}
          labelColor={() => 'rgba(255, 255, 255, 0.9)'}
          labelResolution={2}
          atmosphereColor="#4a90d9"
          atmosphereAltitude={0.15}
          polygonsData={[]}
        />
      </Suspense>
    </div>
  );
};

export default UFOGlobe;
