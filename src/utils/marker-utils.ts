
import { getConnectionStatus } from './api-service';

export interface LocationMarker {
  id: string;
  name: string;
  position: [number, number];
  type: 'pin' | 'area' | 'building';
  description?: string;
  createdAt: Date;
  isPinned?: boolean;
  associatedDrawing?: string;
}

export function saveMarker(marker: LocationMarker): void {
  const savedMarkers = getSavedMarkers();
  
  // Check if marker already exists or is too close to an existing one
  const existingIndex = savedMarkers.findIndex(m => m.id === marker.id);
  const similarPositionIndex = savedMarkers.findIndex(m => {
    const distance = calculateDistance(m.position, marker.position);
    // Consider markers within 1 meter as duplicates
    return distance < 1;
  });
  
  if (similarPositionIndex >= 0 && existingIndex === -1) {
    // Update existing marker at very similar position if it's not an update
    savedMarkers[similarPositionIndex] = {
      ...marker,
      id: savedMarkers[similarPositionIndex].id // Keep original ID
    };
    console.log('Updated existing marker at similar position');
  } else if (existingIndex >= 0) {
    // Update existing marker with same ID
    savedMarkers[existingIndex] = marker;
    console.log('Updated marker with ID:', marker.id);
  } else {
    // Add new marker
    savedMarkers.push(marker);
    console.log('Added new marker with ID:', marker.id);
  }
  
  localStorage.setItem('savedMarkers', JSON.stringify(savedMarkers));
  
  // Dispatch a custom event to notify components that markers have been updated
  window.dispatchEvent(new CustomEvent('markersUpdated'));
  
  syncMarkersWithBackend(savedMarkers);
}

export function getSavedMarkers(): LocationMarker[] {
  const markersJson = localStorage.getItem('savedMarkers');
  if (!markersJson) {
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

function calculateDistance(pos1: [number, number], pos2: [number, number]): number {
  // Simple Haversine formula to calculate distance between two coordinates in meters
  const R = 6371e3; // Earth radius in meters
  const φ1 = (pos1[0] * Math.PI) / 180;
  const φ2 = (pos2[0] * Math.PI) / 180;
  const Δφ = ((pos2[0] - pos1[0]) * Math.PI) / 180;
  const Δλ = ((pos2[1] - pos1[1]) * Math.PI) / 180;
  
  const a = 
    Math.sin(Δφ/2) * Math.sin(Δφ/2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ/2) * Math.sin(Δλ/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
}

export function deleteMarker(id: string): void {
  const savedMarkers = getSavedMarkers();
  const filteredMarkers = savedMarkers.filter(marker => marker.id !== id);
  localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
  
  // Dispatch both events to ensure all components update
  window.dispatchEvent(new CustomEvent('markersUpdated'));
  window.dispatchEvent(new Event('storage'));
  
  // Try to sync with backend
  deleteMarkerFromBackend(id);
}

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
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format from backend');
    }
    
    const markers = await response.json();
    localStorage.setItem('savedMarkers', JSON.stringify(markers));
    console.log('Markers successfully fetched from backend');
  } catch (error) {
    console.error('Error fetching markers from backend:', error);
    throw error;
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
  }
}
