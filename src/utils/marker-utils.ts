
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
  
  // Check if marker already exists (for updates)
  const existingIndex = savedMarkers.findIndex(m => m.id === marker.id);
  
  if (existingIndex >= 0) {
    // Update existing marker
    savedMarkers[existingIndex] = marker;
  } else {
    // Add new marker
    savedMarkers.push(marker);
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

export function deleteMarker(id: string): void {
  const savedMarkers = getSavedMarkers();
  const filteredMarkers = savedMarkers.filter(marker => marker.id !== id);
  localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
  
  // Dispatch a custom event to notify components that markers have been updated
  window.dispatchEvent(new CustomEvent('markersUpdated'));
  
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
