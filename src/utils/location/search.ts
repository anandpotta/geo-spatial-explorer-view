
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { Location } from './types';

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
