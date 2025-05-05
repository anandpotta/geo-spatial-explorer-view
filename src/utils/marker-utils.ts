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
  
  // Ensure we have unique markers in localStorage by ID
  const uniqueMarkers = [];
  const seenIds = new Set();
  
  for (const m of savedMarkers) {
    if (!seenIds.has(m.id)) {
      seenIds.add(m.id);
      uniqueMarkers.push(m);
    }
  }
  
  localStorage.setItem('savedMarkers', JSON.stringify(uniqueMarkers));
  
  // Dispatch a custom event to notify components that markers have been updated
  window.dispatchEvent(new CustomEvent('markersUpdated'));
  
  syncMarkersWithBackend(uniqueMarkers);
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
  try {
    const savedMarkers = getSavedMarkers();
    const filteredMarkers = savedMarkers.filter(marker => marker.id !== id);
    localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
    
    // Ensure both events are dispatched
    try {
      // Use requestAnimationFrame to avoid blocking the UI thread
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('markersUpdated'));
        
        // Force re-enabling of interactions on the body
        document.body.style.pointerEvents = '';
        document.body.removeAttribute('aria-hidden');
        
        // Try to sync with backend in the background
        deleteMarkerFromBackend(id);
      });
    } catch (e) {
      console.error("Error dispatching events:", e);
      // Fallback method for older browsers
      setTimeout(() => {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('markersUpdated'));
      }, 0);
    }
  } catch (e) {
    console.error("Error deleting marker:", e);
  }
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

export function createMarker(markerData: Partial<LocationMarker>): LocationMarker {
  const marker: LocationMarker = {
    id: markerData.id || crypto.randomUUID(),
    name: markerData.name || 'Unnamed Location',
    position: markerData.position || [0, 0],
    type: markerData.type || 'pin',
    description: markerData.description,
    createdAt: markerData.createdAt || new Date(),
    isPinned: markerData.isPinned || false,
    associatedDrawing: markerData.associatedDrawing,
  };
  
  saveMarker(marker);
  return marker;
}
