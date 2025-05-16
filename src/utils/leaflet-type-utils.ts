
import L from 'leaflet';

/**
 * Safely checks if a map instance is valid and ready for use
 */
export function isMapValid(map: any): map is L.Map {
  if (!map) return false;
  
  // Check if map instance exists and has required methods
  if (typeof map.getContainer !== 'function') return false;
  
  try {
    // Check if the container element exists in the DOM
    const container = map.getContainer();
    if (!container || !document.body.contains(container)) {
      return false;
    }
    
    // For maximum safety, check that map has core Leaflet methods
    return typeof map.setView === 'function' && 
           typeof map.addLayer === 'function' && 
           typeof map.getZoom === 'function';
  } catch (err) {
    console.warn('Error checking map validity:', err);
    return false;
  }
}

/**
 * Extracts the map instance from a Leaflet layer
 * @param layer Any Leaflet layer that might be associated with a map
 * @returns The map instance or null if not found/valid
 */
export function getMapFromLayer(layer: L.Layer | null | undefined): L.Map | null {
  if (!layer) return null;
  
  try {
    // Try to access the map property directly (might be private _map)
    const map = (layer as any)._map;
    
    if (isMapValid(map)) {
      return map;
    }
    return null;
  } catch (err) {
    console.error('Error getting map from layer:', err);
    return null;
  }
}

/**
 * Type assertion for Leaflet-specific properties
 * Use this to safely access internal Leaflet properties in TS
 */
export function asLeaflet<T>(obj: any): T {
  return obj as T;
}

/**
 * Type-safe way to check if an element has a Leaflet ID
 */
export function hasLeafletId(element: HTMLElement): boolean {
  return '_leaflet_id' in element;
}
