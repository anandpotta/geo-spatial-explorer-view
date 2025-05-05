
import { LocationMarker } from './types';
import { getCurrentUser } from '../../services/auth-service';
import { getConnectionStatus } from '../api-service';

/**
 * Get all saved markers for the current user
 */
export function getSavedMarkers(): LocationMarker[] {
  const currentUser = getCurrentUser();
  const markersJson = localStorage.getItem('savedMarkers');
  
  if (!markersJson) {
    fetchMarkersFromBackend().catch(() => {
      console.log('Could not fetch markers from backend, using local storage');
    });
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
    
    return markers;
  } catch (e) {
    console.error('Failed to parse saved markers', e);
    return [];
  }
}

/**
 * Save a marker to local storage
 */
export function saveMarker(marker: LocationMarker): void {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot save marker: No user is logged in');
    return;
  }
  
  // Ensure the marker has the current user's ID
  const markerWithUser = {
    ...marker,
    userId: currentUser.id
  };
  
  const savedMarkers = getSavedMarkers();
  
  // Check if marker already exists (for updates)
  const existingIndex = savedMarkers.findIndex(m => m.id === markerWithUser.id);
  
  if (existingIndex >= 0) {
    // Update existing marker
    savedMarkers[existingIndex] = markerWithUser;
  } else {
    // Add new marker
    savedMarkers.push(markerWithUser);
  }
  
  localStorage.setItem('savedMarkers', JSON.stringify(savedMarkers));
  
  // Dispatch a custom event to notify components that markers have been updated
  window.dispatchEvent(new CustomEvent('markersUpdated'));
  
  syncMarkersWithBackend(savedMarkers);
}

/**
 * Delete a marker from local storage
 */
export function deleteMarker(id: string): void {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.error('Cannot delete marker: No user is logged in');
      return;
    }
    
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
