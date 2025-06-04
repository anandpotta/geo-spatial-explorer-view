
import { LocationMarker } from './types';
import { getCurrentUser } from '../../services/auth-service';
import { toast } from 'sonner';
import { syncMarkersWithBackend, fetchMarkersFromBackend, deleteMarkerFromBackend } from './sync';
import { getConnectionStatus } from '../api-service';

// Global flags to prevent event loops
let isUpdatingMarkers = false;
let lastEventTime = 0;
let eventDispatchTimer: NodeJS.Timeout | null = null;

// Completely remove automatic event dispatching to prevent loops
const dispatchMarkersEvent = () => {
  // Only dispatch if we're not already updating and enough time has passed
  const now = Date.now();
  if (isUpdatingMarkers || (now - lastEventTime < 2000)) {
    return;
  }
  
  // Clear any existing timer
  if (eventDispatchTimer) {
    clearTimeout(eventDispatchTimer);
    eventDispatchTimer = null;
  }
  
  // Set a timer with a much longer delay
  eventDispatchTimer = setTimeout(() => {
    if (!isUpdatingMarkers) {
      lastEventTime = Date.now();
      // Only dispatch to specific listeners, not storage
      window.dispatchEvent(new CustomEvent('markersUpdated', { detail: { source: 'storage' } }));
    }
    eventDispatchTimer = null;
  }, 1000);
};

export function getSavedMarkers(): LocationMarker[] {
  const currentUser = getCurrentUser();
  const markersJson = localStorage.getItem('savedMarkers');
  
  if (!markersJson) {
    // Try to fetch from backend first if localStorage is empty
    const { isOnline, isBackendAvailable } = getConnectionStatus();
    if (isOnline && isBackendAvailable) {
      fetchMarkersFromBackend().catch(err => {
        // Silent fail for initial load
        console.log('Could not fetch markers from backend, using local storage');
      });
    }
    return [];
  }
  
  try {
    let markers = JSON.parse(markersJson);
    
    // Map the dates
    markers = markers.map((marker: any) => ({
      ...marker,
      createdAt: new Date(marker.createdAt)
    }));
    
    // Filter markers by user if a user is logged in
    if (currentUser) {
      markers = markers.filter((marker: LocationMarker) => marker.userId === currentUser.id);
    }
    
    // Deduplicate markers by ID - this helps prevent duplicates
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
  if (isUpdatingMarkers) return;
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot save marker: No user is logged in');
    toast.error('Please log in to save your markers');
    return;
  }
  
  isUpdatingMarkers = true;
  
  // Ensure the marker has a user ID
  const markerWithUser = {
    ...marker,
    userId: currentUser.id
  };
  
  // Get existing markers and deduplicate before saving
  const savedMarkers = getSavedMarkers();
  
  // Check if marker with same ID exists and update it
  const existingIndex = savedMarkers.findIndex(m => m.id === markerWithUser.id);
  
  if (existingIndex >= 0) {
    // Update existing marker
    savedMarkers[existingIndex] = markerWithUser;
  } else {
    // Add new marker
    savedMarkers.push(markerWithUser);
  }
  
  // Deduplicate markers before saving to ensure no duplicates
  const uniqueMarkers = new Map<string, LocationMarker>();
  savedMarkers.forEach(m => uniqueMarkers.set(m.id, m));
  
  localStorage.setItem('savedMarkers', JSON.stringify(Array.from(uniqueMarkers.values())));
  
  // Reset updating flag after a longer delay
  setTimeout(() => {
    isUpdatingMarkers = false;
    // Only dispatch event after saving is complete
    dispatchMarkersEvent();
  }, 500);
  
  // Only attempt to sync if we're online
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
  if (isUpdatingMarkers) return;
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot rename marker: No user is logged in');
    toast.error('Please log in to manage your markers');
    return;
  }
  
  isUpdatingMarkers = true;
  
  const savedMarkers = getSavedMarkers();
  const markerIndex = savedMarkers.findIndex(marker => marker.id === id);
  
  if (markerIndex === -1) {
    console.error('Marker not found');
    toast.error('Location not found');
    isUpdatingMarkers = false;
    return;
  }
  
  // Update the marker name
  savedMarkers[markerIndex] = {
    ...savedMarkers[markerIndex],
    name: newName
  };
  
  localStorage.setItem('savedMarkers', JSON.stringify(savedMarkers));
  
  // Reset updating flag after a longer delay
  setTimeout(() => {
    isUpdatingMarkers = false;
    dispatchMarkersEvent();
  }, 500);
  
  // Only attempt to sync if we're online
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
  if (isUpdatingMarkers) return;
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot delete marker: No user is logged in');
    toast.error('Please log in to manage your markers');
    return;
  }
  
  isUpdatingMarkers = true;
  
  const savedMarkers = getSavedMarkers();
  const filteredMarkers = savedMarkers.filter(marker => marker.id !== id);
  localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
  
  // Reset updating flag after a longer delay
  setTimeout(() => {
    isUpdatingMarkers = false;
    dispatchMarkersEvent();
  }, 500);
  
  // Only attempt to sync delete if we're online
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
