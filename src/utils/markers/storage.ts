
import { LocationMarker } from './types';
import { syncMarkersWithBackend, fetchMarkersFromBackend, deleteMarkerFromBackend } from './sync';
import { v4 as uuidv4 } from 'uuid';

/**
 * Saves a marker to localStorage and triggers sync events
 */
export function saveMarker(marker: LocationMarker): void {
  const savedMarkers = getSavedMarkers();
  
  // Ensure marker has a truly unique ID
  if (!marker.id || marker.id.trim() === '') {
    marker.id = `${Date.now().toString(36)}-${uuidv4()}`;
  }
  
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
  
  // Use a custom event with a unique timestamp to prevent duplicate events
  const timestamp = Date.now();
  const eventDetail = { timestamp, source: 'saveMarker' };
  
  // Use setTimeout to ensure we don't fire too many events in quick succession
  // This helps prevent duplicate rendering
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('markersUpdated', { detail: eventDetail }));
  }, 0);
  
  // Only sync the unique markers with backend
  syncMarkersWithBackend(uniqueMarkers);
}

/**
 * Deduplicates markers by ID, keeping the most recent version
 */
export function deduplicateMarkers(markers: LocationMarker[]): LocationMarker[] {
  if (!Array.isArray(markers)) {
    console.warn('Attempted to deduplicate non-array markers', markers);
    return [];
  }
  
  // Use a Map to naturally deduplicate by ID
  const markerMap = new Map<string, LocationMarker>();
  
  // Process all markers
  markers.forEach(marker => {
    if (marker && marker.id) {
      markerMap.set(marker.id, marker);
    }
  });
  
  return Array.from(markerMap.values());
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
    const parsedMarkers = JSON.parse(markersJson);
    
    if (!Array.isArray(parsedMarkers)) {
      console.warn('Saved markers is not an array', parsedMarkers);
      return [];
    }
    
    // Ensure each marker has appropriate properties and is deduplicated
    const processedMarkers = parsedMarkers
      .filter(marker => marker && marker.id) // Filter out invalid markers
      .map((marker: any) => ({
        ...marker,
        createdAt: new Date(marker.createdAt)
      }));
    
    return deduplicateMarkers(processedMarkers);
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
    
    // Ensure events are dispatched with unique timestamps and after a short delay
    // to prevent event collision
    const timestamp = Date.now();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('markersUpdated', { 
        detail: { timestamp, source: 'deleteMarker' } 
      }));
      
      // Force re-enabling of interactions on the body
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('aria-hidden');
      
      // Try to sync with backend in the background
      deleteMarkerFromBackend(id);
    }, 10);
  } catch (e) {
    console.error("Error deleting marker:", e);
  }
}
