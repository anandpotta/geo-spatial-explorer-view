
import { LocationMarker } from '@/utils/geo-utils';

/**
 * Removes duplicate markers by ID from an array
 */
export const deduplicateMarkers = (markerArray: LocationMarker[]): LocationMarker[] => {
  const uniqueMarkers: LocationMarker[] = [];
  const seenIds = new Set<string>();
  
  for (const marker of markerArray) {
    if (!seenIds.has(marker.id)) {
      seenIds.add(marker.id);
      uniqueMarkers.push(marker);
    }
  }
  
  return uniqueMarkers;
};

/**
 * Checks if two arrays of markers are different
 */
export const markersHaveChanged = (
  oldMarkers: LocationMarker[], 
  newMarkers: LocationMarker[]
): boolean => {
  if (oldMarkers.length !== newMarkers.length) {
    return true;
  }
  
  const oldIds = new Set(oldMarkers.map(m => m.id));
  const newIds = new Set(newMarkers.map(m => m.id));
  
  // Check if any IDs were added or removed
  if (oldIds.size !== newIds.size) {
    return true;
  }
  
  // Check if any IDs are different
  for (const id of oldIds) {
    if (!newIds.has(id)) {
      return true;
    }
  }
  
  // Check if any positions changed
  for (let i = 0; i < oldMarkers.length; i++) {
    const oldMarker = oldMarkers[i];
    const newMarker = newMarkers.find(m => m.id === oldMarker.id);
    
    if (!newMarker) {
      return true;
    }
    
    if (
      oldMarker.position[0] !== newMarker.position[0] ||
      oldMarker.position[1] !== newMarker.position[1] ||
      oldMarker.name !== newMarker.name
    ) {
      return true;
    }
  }
  
  return false;
};
