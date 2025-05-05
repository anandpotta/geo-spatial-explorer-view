import { LocationMarker } from '@/utils/markers/types';

/**
 * Deduplicate markers based on ID, keeping the most recent version
 */
export function deduplicateMarkers(markers: LocationMarker[]): LocationMarker[] {
  if (!Array.isArray(markers) || markers.length === 0) {
    return [];
  }

  const uniqueMarkers: LocationMarker[] = [];
  const seenIds = new Set<string>();
  
  // Process markers in reverse order to keep the most recent version of duplicates
  for (let i = markers.length - 1; i >= 0; i--) {
    const marker = markers[i];
    if (marker && marker.id && !seenIds.has(marker.id)) {
      seenIds.add(marker.id);
      uniqueMarkers.unshift(marker); // Add to front to maintain original order
    }
  }
  
  console.log(`Deduplicated ${markers.length} markers down to ${uniqueMarkers.length}`);
  return uniqueMarkers;
}

/**
 * Check if two marker arrays have different content
 */
export function markersHaveChanged(oldMarkers: LocationMarker[], newMarkers: LocationMarker[]): boolean {
  // Quick length check
  if (oldMarkers.length !== newMarkers.length) {
    return true;
  }
  
  // Create maps for quick lookup
  const oldMap = new Map<string, LocationMarker>();
  const newMap = new Map<string, LocationMarker>();
  
  oldMarkers.forEach(m => oldMap.set(m.id, m));
  newMarkers.forEach(m => newMap.set(m.id, m));
  
  // Check if all IDs are the same
  if ([...oldMap.keys()].sort().join(',') !== [...newMap.keys()].sort().join(',')) {
    return true;
  }
  
  // Check for content differences in positions
  for (const [id, oldMarker] of oldMap.entries()) {
    const newMarker = newMap.get(id);
    if (!newMarker) return true;
    
    // Compare positions (the most important property for display)
    if (oldMarker.position[0] !== newMarker.position[0] || 
        oldMarker.position[1] !== newMarker.position[1]) {
      return true;
    }
  }
  
  return false;
}
