import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { getConnectionStatus } from './api-service';

export interface Location {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
  raw?: any;
}

export interface LocationMarker {
  id: string;
  name: string;
  position: [number, number]; // [lat, lng]
  type: 'pin' | 'area' | 'building';
  description?: string;
  createdAt: Date;
  isPinned?: boolean;
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

// Storage functions for saved markers
export function saveMarker(marker: LocationMarker): void {
  const savedMarkers = getSavedMarkers();
  savedMarkers.push(marker);
  localStorage.setItem('savedMarkers', JSON.stringify(savedMarkers));
  
  // Sync with backend
  syncMarkersWithBackend(savedMarkers);
}

export function getSavedMarkers(): LocationMarker[] {
  const markersJson = localStorage.getItem('savedMarkers');
  if (!markersJson) {
    // Try to fetch from backend first if localStorage is empty, but don't await
    fetchMarkersFromBackend().catch(() => {
      console.log('Could not fetch markers from backend, using local storage');
    });
    return [];
  }
  
  try {
    const markers = JSON.parse(markersJson);
    return markers.map((marker: any) => ({
      ...marker,
      createdAt: new Date(marker.createdAt)
    }));
  } catch (e) {
    console.error('Failed to parse saved markers', e);
    return [];
  }
}

export function deleteMarker(id: string): void {
  const savedMarkers = getSavedMarkers();
  const filteredMarkers = savedMarkers.filter(marker => marker.id !== id);
  localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
  
  // Sync deletion with backend
  deleteMarkerFromBackend(id);
}

// Backend synchronization functions
async function syncMarkersWithBackend(markers: LocationMarker[]): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) return;
  
  try {
    const response = await fetch('/api/markers/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(markers),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync markers with backend');
    }
    
    console.log('Markers successfully synced with backend');
  } catch (error) {
    console.error('Error syncing markers with backend:', error);
    // Continue with local storage only if backend is unavailable
  }
}

async function fetchMarkersFromBackend(): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) {
    throw new Error('Backend unavailable');
  }
  
  try {
    const response = await fetch('/api/markers');
    
    if (!response.ok) {
      throw new Error('Failed to fetch markers from backend');
    }
    
    // Check content type to avoid parsing HTML as JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format from backend');
    }
    
    const markers = await response.json();
    localStorage.setItem('savedMarkers', JSON.stringify(markers));
    console.log('Markers successfully fetched from backend');
  } catch (error) {
    console.error('Error fetching markers from backend:', error);
    // Continue with empty local storage if backend is unavailable
    throw error; // Re-throw to inform caller
  }
}

async function deleteMarkerFromBackend(id: string): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) return;
  
  try {
    const response = await fetch(`/api/markers/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete marker from backend');
    }
    
    console.log('Marker successfully deleted from backend');
  } catch (error) {
    console.error('Error deleting marker from backend:', error);
    // Continue with local storage only if backend is unavailable
  }
}

// Drawing related functions
export interface DrawingData {
  id: string;
  type: 'polygon' | 'circle' | 'freehand';
  coordinates: Array<[number, number]>;
  properties: {
    name?: string;
    description?: string;
    createdAt: Date;
  };
}

export function saveDrawing(drawing: DrawingData): void {
  const savedDrawings = getSavedDrawings();
  savedDrawings.push(drawing);
  localStorage.setItem('savedDrawings', JSON.stringify(savedDrawings));
  
  // Sync with backend
  syncDrawingsWithBackend(savedDrawings);
}

export function getSavedDrawings(): DrawingData[] {
  const drawingsJson = localStorage.getItem('savedDrawings');
  if (!drawingsJson) {
    // Try to fetch from backend first if localStorage is empty
    fetchDrawingsFromBackend();
    return [];
  }
  
  try {
    const drawings = JSON.parse(drawingsJson);
    return drawings.map((drawing: any) => ({
      ...drawing,
      properties: {
        ...drawing.properties,
        createdAt: new Date(drawing.properties.createdAt)
      }
    }));
  } catch (e) {
    console.error('Failed to parse saved drawings', e);
    return [];
  }
}

export function deleteDrawing(id: string): void {
  const savedDrawings = getSavedDrawings();
  const filteredDrawings = savedDrawings.filter(drawing => drawing.id !== id);
  localStorage.setItem('savedDrawings', JSON.stringify(filteredDrawings));
  
  // Sync deletion with backend
  deleteDrawingFromBackend(id);
}

async function syncDrawingsWithBackend(drawings: DrawingData[]): Promise<void> {
  try {
    const response = await fetch('/api/drawings/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(drawings),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync drawings with backend');
    }
    
    console.log('Drawings successfully synced with backend');
  } catch (error) {
    console.error('Error syncing drawings with backend:', error);
    // Continue with local storage only if backend is unavailable
  }
}

async function fetchDrawingsFromBackend(): Promise<void> {
  try {
    const response = await fetch('/api/drawings');
    
    if (!response.ok) {
      throw new Error('Failed to fetch drawings from backend');
    }
    
    const drawings = await response.json();
    localStorage.setItem('savedDrawings', JSON.stringify(drawings));
    console.log('Drawings successfully fetched from backend');
  } catch (error) {
    console.error('Error fetching drawings from backend:', error);
    // Continue with empty local storage if backend is unavailable
  }
}

async function deleteDrawingFromBackend(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/drawings/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete drawing from backend');
    }
    
    console.log('Drawing successfully deleted from backend');
  } catch (error) {
    console.error('Error deleting drawing from backend:', error);
    // Continue with local storage only if backend is unavailable
  }
}
