
export interface Location {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
  raw?: any;
}

// Sample offline locations data for fallback
const offlineLocations = [
  {
    id: "offline-1",
    label: "New York City, NY, USA",
    x: -74.0060,
    y: 40.7128,
    raw: { place_id: "offline-1", display_name: "New York City, NY, USA" }
  },
  {
    id: "offline-2",
    label: "Los Angeles, CA, USA",
    x: -118.2437,
    y: 34.0522,
    raw: { place_id: "offline-2", display_name: "Los Angeles, CA, USA" }
  },
  {
    id: "offline-3",
    label: "London, United Kingdom",
    x: -0.1278,
    y: 51.5074,
    raw: { place_id: "offline-3", display_name: "London, United Kingdom" }
  },
  {
    id: "offline-4",
    label: "Tokyo, Japan",
    x: 139.6503,
    y: 35.6762,
    raw: { place_id: "offline-4", display_name: "Tokyo, Japan" }
  },
  {
    id: "offline-5",
    label: "Sydney, Australia",
    x: 151.2093,
    y: -33.8688,
    raw: { place_id: "offline-5", display_name: "Sydney, Australia" }
  },
];

// Google Places API key - replace with your own API key
// Note: In production, you should handle this key securely
const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY";

// Search for locations using Google Places API with offline fallback
export async function searchLocations(query: string): Promise<Location[]> {
  if (!query || query.length < 3) return [];
  
  // First try online search with Google Places API
  try {
    // Check if we have network and API key
    if (navigator.onLine && GOOGLE_API_KEY && GOOGLE_API_KEY !== "YOUR_GOOGLE_API_KEY") {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`,
        { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google API error: ${data.status}`);
      }
      
      if (!data.predictions || data.predictions.length === 0) {
        return [];
      }
      
      // We need to get details for each place to get coordinates
      const results: Location[] = [];
      
      // For demonstration, we'll use Promise.all to fetch details for all predictions
      // Note: In production, you might want to limit this or implement pagination
      const detailsPromises = data.predictions.slice(0, 5).map(async (prediction: any) => {
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry&key=${GOOGLE_API_KEY}`,
            { 
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }
          );
          
          if (!detailsResponse.ok) {
            return null;
          }
          
          const detailsData = await detailsResponse.json();
          
          if (detailsData.status !== "OK" || !detailsData.result || !detailsData.result.geometry) {
            return null;
          }
          
          return {
            id: prediction.place_id,
            label: prediction.description,
            x: detailsData.result.geometry.location.lng, // longitude
            y: detailsData.result.geometry.location.lat, // latitude
            raw: {
              place_id: prediction.place_id,
              display_name: prediction.description,
              ...detailsData.result
            }
          };
        } catch (error) {
          console.error('Error fetching place details:', error);
          return null;
        }
      });
      
      const detailsResults = await Promise.all(detailsPromises);
      return detailsResults.filter((result): result is Location => result !== null);
    } else {
      // API key not set or offline, fall back to offline search
      throw new Error('API key not set or offline');
    }
  } catch (error) {
    console.error('Error searching for locations:', error);
    
    // Fallback to offline search when network request fails
    console.log('Using offline location data as fallback');
    
    // Simple filter for offline data
    const filteredLocations = offlineLocations.filter(location => 
      location.label.toLowerCase().includes(query.toLowerCase())
    );
    
    return filteredLocations;
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
