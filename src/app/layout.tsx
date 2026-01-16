import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UFO Sightings Tracker',
  description: 'Real-time tracking of UFO sightings around the world',
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
