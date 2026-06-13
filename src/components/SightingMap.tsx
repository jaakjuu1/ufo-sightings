'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { MapPoint } from '@/lib/types';
import { shapeColor, COUNTRY_NAMES } from '@/lib/types';

interface Props {
  points: MapPoint[];
}

// Renders the supplied (already down-sampled) points as lightweight canvas
// circle markers. Leaflet is imported dynamically so it never runs during SSR.
export default function SightingMap({ points }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;
    import('leaflet').then((mod) => {
      const L = mod.default;
      if (cancelled || !elRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(elRef.current, {
        center: [34, -40],
        zoom: 2,
        minZoom: 2,
        maxZoom: 12,
        worldCopyJump: true,
        attributionControl: false,
        preferCanvas: true,
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);
      L.control.attribution({ prefix: false })
        .addAttribution('© OpenStreetMap · CARTO · NUFORC')
        .addTo(map);
      mapRef.current = map;
      renderPoints();
    });
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw markers whenever the point set changes.
  useEffect(() => {
    renderPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  function renderPoints() {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    const layer = L.layerGroup();
    for (const p of points) {
      const color = shapeColor(p.shape);
      const date = new Date(p.datetime).toLocaleDateString();
      const place = [p.city, COUNTRY_NAMES[p.country] || p.country.toUpperCase()]
        .filter(Boolean)
        .join(', ');
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 4,
        color,
        weight: 1,
        fillColor: color,
        fillOpacity: 0.7,
      });
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:190px">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">${escapeHtml(place)}</div>
          <div style="font-size:11px;color:#9ca3af;margin-bottom:6px">${date} · <span style="color:${color};text-transform:capitalize">${escapeHtml(p.shape)}</span> · ${escapeHtml(p.duration || '')}</div>
          <div style="font-size:11px;color:#cbd5e1;line-height:1.4">${escapeHtml(p.summary || '')}</div>
        </div>`,
        { className: 'ufo-popup' },
      );
      layer.addLayer(marker);
    }
    layer.addTo(map);
    layerRef.current = layer;
  }

  return <div ref={elRef} className="map-canvas" />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
