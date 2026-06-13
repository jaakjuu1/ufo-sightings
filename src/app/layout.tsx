import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UFO Sightings Atlas',
  description:
    'Explore 80,000+ real UFO sighting reports from the National UFO Reporting Center (1906–2014): shapes, hotspots, time-of-day and seasonal patterns, and a searchable interactive map.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
