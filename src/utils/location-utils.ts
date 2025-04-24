
import { OpenStreetMapProvider } from 'leaflet-geosearch';

export interface Location {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
  raw?: any;
}

// Initialize the provider
const provider = new OpenStreetMapProvider();

// Search for locations
export async function searchLocations(query: string): Promise<Location[]> {
  if (!query || query.length < 3) return [];
  
  try {
    const results = await provider.search({ query });
    
    return results.map((result) => ({
      id: result.raw.place_id.toString(),
      label: result.label,
      x: result.x,  // longitude
      y: result.y,  // latitude
      raw: result.raw
    }));
  } catch (error) {
    console.error('Error searching for locations:', error);
    return [];
  }
}

// Format coordinates to human-readable
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

// Calculate distance between two coordinates in kilometers
export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}
