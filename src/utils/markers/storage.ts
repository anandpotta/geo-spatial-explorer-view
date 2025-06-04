
import { LocationMarker } from './types';
import { getCurrentUser } from '../../services/auth-service';
import { toast } from 'sonner';
import { syncMarkersWithBackend, fetchMarkersFromBackend, deleteMarkerFromBackend } from './sync';
import { getConnectionStatus } from '../api-service';

// Global state management to prevent all loops
let isUpdatingStorage = false;
let lastUpdateTime = 0;
const MIN_UPDATE_INTERVAL = 2000; // 2 seconds minimum between updates

// Completely remove automatic event dispatching
export function getSavedMarkers(): LocationMarker[] {
  const currentUser = getCurrentUser();
  const markersJson = localStorage.getItem('savedMarkers');
  
  if (!markersJson) {
    const { isOnline, isBackendAvailable } = getConnectionStatus();
    if (isOnline && isBackendAvailable) {
      fetchMarkersFromBackend().catch(err => {
        console.log('Could not fetch markers from backend, using local storage');
      });
    }
    return [];
  }
  
  try {
    let markers = JSON.parse(markersJson);
    
    markers = markers.map((marker: any) => ({
      ...marker,
      createdAt: new Date(marker.createdAt)
    }));
    
    if (currentUser) {
      markers = markers.filter((marker: LocationMarker) => marker.userId === currentUser.id);
    }
    
    const uniqueMarkers = new Map<string, LocationMarker>();
    markers.forEach((marker: LocationMarker) => {
      uniqueMarkers.set(marker.id, marker);
    });
    
    return Array.from(uniqueMarkers.values());
  } catch (e) {
    console.error('Failed to parse saved markers', e);
    return [];
  }
}

export function saveMarker(marker: LocationMarker): void {
  const now = Date.now();
  
  // Prevent rapid successive updates
  if (isUpdatingStorage || (now - lastUpdateTime < MIN_UPDATE_INTERVAL)) {
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot save marker: No user is logged in');
    toast.error('Please log in to save your markers');
    return;
  }
  
  isUpdatingStorage = true;
  lastUpdateTime = now;
  
  const markerWithUser = {
    ...marker,
    userId: currentUser.id
  };
  
  const savedMarkers = getSavedMarkers();
  const existingIndex = savedMarkers.findIndex(m => m.id === markerWithUser.id);
  
  if (existingIndex >= 0) {
    savedMarkers[existingIndex] = markerWithUser;
  } else {
    savedMarkers.push(markerWithUser);
  }
  
  const uniqueMarkers = new Map<string, LocationMarker>();
  savedMarkers.forEach(m => uniqueMarkers.set(m.id, m));
  
  localStorage.setItem('savedMarkers', JSON.stringify(Array.from(uniqueMarkers.values())));
  
  // Only dispatch a single, throttled event
  setTimeout(() => {
    isUpdatingStorage = false;
    // Use a custom event that components can opt into
    window.dispatchEvent(new CustomEvent('markersSaved', { 
      detail: { 
        source: 'storage',
        timestamp: now
      } 
    }));
  }, 1000);
  
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (isOnline && isBackendAvailable) {
    syncMarkersWithBackend(Array.from(uniqueMarkers.values()))
      .catch(err => {
        if (navigator.onLine) {
          console.warn('Failed to sync markers, will retry later:', err);
        }
      });
  }
}

export function renameMarker(id: string, newName: string): void {
  const now = Date.now();
  
  if (isUpdatingStorage || (now - lastUpdateTime < MIN_UPDATE_INTERVAL)) {
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot rename marker: No user is logged in');
    toast.error('Please log in to manage your markers');
    return;
  }
  
  isUpdatingStorage = true;
  lastUpdateTime = now;
  
  const savedMarkers = getSavedMarkers();
  const markerIndex = savedMarkers.findIndex(marker => marker.id === id);
  
  if (markerIndex === -1) {
    console.error('Marker not found');
    toast.error('Location not found');
    isUpdatingStorage = false;
    return;
  }
  
  savedMarkers[markerIndex] = {
    ...savedMarkers[markerIndex],
    name: newName
  };
  
  localStorage.setItem('savedMarkers', JSON.stringify(savedMarkers));
  
  setTimeout(() => {
    isUpdatingStorage = false;
    window.dispatchEvent(new CustomEvent('markersSaved', { 
      detail: { 
        source: 'storage',
        timestamp: now
      } 
    }));
  }, 1000);
  
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (isOnline && isBackendAvailable) {
    syncMarkersWithBackend(savedMarkers)
      .catch(err => {
        if (navigator.onLine) {
          console.warn('Failed to sync renamed marker, will retry later:', err);
        }
      });
  }
  
  toast.success('Location renamed successfully');
}

export function deleteMarker(id: string): void {
  const now = Date.now();
  
  if (isUpdatingStorage || (now - lastUpdateTime < MIN_UPDATE_INTERVAL)) {
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot delete marker: No user is logged in');
    toast.error('Please log in to manage your markers');
    return;
  }
  
  isUpdatingStorage = true;
  lastUpdateTime = now;
  
  const savedMarkers = getSavedMarkers();
  const filteredMarkers = savedMarkers.filter(marker => marker.id !== id);
  localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
  
  setTimeout(() => {
    isUpdatingStorage = false;
    window.dispatchEvent(new CustomEvent('markersSaved', { 
      detail: { 
        source: 'storage',
        timestamp: now
      } 
    }));
  }, 1000);
  
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (isOnline && isBackendAvailable) {
    deleteMarkerFromBackend(id)
      .catch(err => {
        if (navigator.onLine) {
          console.warn('Failed to delete marker from backend, will retry later:', err);
        }
      });
  }
}
