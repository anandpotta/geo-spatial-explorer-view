
import { LocationMarker } from './types';
import { getCurrentUser } from '../../services/auth-service';
import { toast } from 'sonner';
import { syncMarkersWithBackend, fetchMarkersFromBackend, deleteMarkerFromBackend } from './sync';
import { getConnectionStatus } from '../api-service';

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
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot save marker: No user is logged in');
    toast.error('Please log in to save your markers');
    return;
  }
  
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
  
  // Notify components about storage changes
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('markersUpdated'));
  
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

export function deleteMarker(id: string): void {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot delete marker: No user is logged in');
    toast.error('Please log in to manage your markers');
    return;
  }
  
  const savedMarkers = getSavedMarkers();
  const filteredMarkers = savedMarkers.filter(marker => marker.id !== id);
  localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
  
  // Notify components about storage changes
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('markersUpdated'));
  
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
