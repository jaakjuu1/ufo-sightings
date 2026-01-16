import { NextResponse } from 'next/server';

export async function GET() {
  const data = [
    { id: '1', datetime: '2025-01-10 22:30:00', city: 'Phoenix', state: 'AZ', country: 'USA', shape: 'Light', duration: '10 min', summary: 'Bright lights', lat: 33.4484, lng: -112.0740 },
    { id: '2', datetime: '2025-01-09 21:15:00', city: 'Los Angeles', state: 'CA', country: 'USA', shape: 'Circle', duration: '2 min', summary: 'Orange orb', lat: 34.0522, lng: -118.2437 },
    { id: '3', datetime: '2025-01-08 03:45:00', city: 'Chicago', state: 'IL', country: 'USA', shape: 'Triangle', duration: '5 min', summary: 'Black triangle', lat: 41.8781, lng: -87.6298 },
    { id: '4', datetime: '2025-01-07 19:20:00', city: 'London', state: '', country: 'UK', shape: 'Sphere', duration: '3 min', summary: 'Silver sphere', lat: 51.5074, lng: -0.1278 },
    { id: '5', datetime: '2025-01-06 23:00:00', city: 'Tokyo', state: '', country: 'Japan', shape: 'Cigar', duration: '8 min', summary: 'Elongated craft', lat: 35.6762, lng: 139.6503 },
    { id: '6', datetime: '2025-01-05 02:30:00', city: 'Denver', state: 'CO', country: 'USA', shape: 'Fireball', duration: '1 min', summary: 'Green fireball', lat: 39.7392, lng: -104.9903 },
    { id: '7', datetime: '2025-01-04 20:15:00', city: 'Seattle', state: 'WA', country: 'USA', shape: 'Disk', duration: '4 min', summary: 'Classic saucer', lat: 47.6062, lng: -122.3321 },
    { id: '8', datetime: '2025-01-03 18:45:00', city: 'Sydney', state: 'NSW', country: 'Australia', shape: 'Triangle', duration: '6 min', summary: 'Three lights', lat: -33.8688, lng: 151.2093 },
    { id: '9', datetime: '2025-01-02 22:00:00', city: 'New York', state: 'NY', country: 'USA', shape: 'Chevron', duration: '2 min', summary: 'Crescent-shaped', lat: 40.7128, lng: -74.0060 },
    { id: '10', datetime: '2025-01-01 01:30:00', city: 'Mexico City', state: '', country: 'Mexico', shape: 'Oval', duration: '7 min', summary: 'Huge oval', lat: 19.4326, lng: -99.1332 },
    { id: '11', datetime: '2024-12-31 23:45:00', city: 'Paris', state: '', country: 'France', shape: 'Light', duration: '3 min', summary: 'Multiple lights', lat: 48.8566, lng: 2.3522 },
    { id: '12', datetime: '2024-12-30 21:20:00', city: 'Miami', state: 'FL', country: 'USA', shape: 'Rectangle', duration: '5 min', summary: 'Flat rectangular', lat: 25.7617, lng: -80.1918 },
    { id: '13', datetime: '2024-12-29 02:10:00', city: 'Las Vegas', state: 'NV', country: 'USA', shape: 'Sphere', duration: '15 min', summary: 'Cluster of orbs', lat: 36.1699, lng: -115.1398 },
    { id: '14', datetime: '2024-12-28 19:50:00', city: 'Toronto', state: 'ON', country: 'Canada', shape: 'Cylinder', duration: '4 min', summary: 'Metallic cylinder', lat: 43.6532, lng: -79.3832 },
    { id: '15', datetime: '2024-12-27 20:30:00', city: 'Berlin', state: '', country: 'Germany', shape: 'Diamond', duration: '2 min', summary: 'Diamond pulsing', lat: 52.5200, lng: 13.4050 },
  ];
  
  return NextResponse.json(data);
}
