import { LocationMarker } from './types';
import { syncMarkersWithBackend, fetchMarkersFromBackend, deleteMarkerFromBackend } from './sync';

/**
 * Saves a marker to localStorage and triggers sync events
 */
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
  const uniqueMarkers = deduplicateMarkers(savedMarkers);
  
  localStorage.setItem('savedMarkers', JSON.stringify(uniqueMarkers));
  
  // Use a custom event to signal marker updates with a timestamp to prevent duplicate events
  const eventDetail = { timestamp: Date.now() };
  const event = new CustomEvent('markersUpdated', { detail: eventDetail });
  window.dispatchEvent(event);
  
  // Only sync the unique markers with backend
  syncMarkersWithBackend(uniqueMarkers);
}

/**
 * Deduplicates markers by ID, keeping the most recent version
 */
function deduplicateMarkers(markers: LocationMarker[]): LocationMarker[] {
  const uniqueMarkers: LocationMarker[] = [];
  const seenIds = new Set<string>();
  
  // Process markers in reverse order to keep the most recent version of duplicates
  // This ensures we keep the most up-to-date version of each marker
  for (let i = markers.length - 1; i >= 0; i--) {
    const marker = markers[i];
    if (!seenIds.has(marker.id)) {
      seenIds.add(marker.id);
      uniqueMarkers.unshift(marker); // Add to front to maintain original order
    }
  }
  
  return uniqueMarkers;
}

/**
 * Gets all markers from localStorage
 */
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
    // Ensure each marker has appropriate properties
    return deduplicateMarkers(markers.map((marker: any) => ({
      ...marker,
      createdAt: new Date(marker.createdAt)
    })));
  } catch (e) {
    console.error('Failed to parse saved markers', e);
    return [];
  }
}

/**
 * Deletes a marker from localStorage and triggers sync events
 */
export function deleteMarker(id: string): void {
  try {
    const savedMarkers = getSavedMarkers();
    const filteredMarkers = savedMarkers.filter(marker => marker.id !== id);
    localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
    
    // Ensure both events are dispatched with unique timestamps
    const eventDetail = { timestamp: Date.now() };
    try {
      // Use requestAnimationFrame to avoid blocking the UI thread
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('storage', { detail: eventDetail }));
        window.dispatchEvent(new CustomEvent('markersUpdated', { detail: eventDetail }));
        
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
        window.dispatchEvent(new CustomEvent('storage', { detail: eventDetail }));
        window.dispatchEvent(new CustomEvent('markersUpdated', { detail: eventDetail }));
      }, 0);
    }
  } catch (e) {
    console.error("Error deleting marker:", e);
  }
}
