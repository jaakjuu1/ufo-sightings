'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { UFOSighting } from '@/lib/ufo-api';

interface MapProps {
  sightings: UFOSighting[];
}

const UFOMap: React.FC<MapProps> = ({ sightings }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map
    const map = L.map(mapRef.current, {
      center: [30, -50],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });

    // Dark themed tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Custom UFO marker icon
    const ufoIcon = L.divIcon({
      className: 'ufo-marker',
      html: `<div style="
        width: 12px;
        height: 12px;
        background: #a855f7;
        border-radius: 50%;
        box-shadow: 0 0 10px #a855f7, 0 0 20px #a855f7;
        animation: pulse 2s infinite;
      "></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    // Add markers for each sighting
    sightings.forEach((s, i) => {
      const marker = L.marker([s.lat, s.lng], { icon: ufoIcon }).addTo(map);
      
      // Popup with details
      const popupContent = `
        <div style="
          background: #1f2937;
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-family: system-ui;
          min-width: 200px;
        ">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
            ${s.city}, ${s.country}
          </h3>
          <p style="margin: 4px 0; font-size: 12px; color: #9ca3af;">
            ${new Date(s.datetime).toLocaleDateString()}
          </p>
          <p style="margin: 4px 0; font-size: 12px;">
            <span style="color: #a855f7;">${s.shape}</span> • ${s.duration}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #6b7280; line-height: 1.4;">
            ${s.summary}
          </p>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'ufo-popup'
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [sightings]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        borderRadius: '0.75rem',
        background: '#0f0a1e'
      }}
    />
  );
};

export default Map;
