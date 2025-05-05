
import L from 'leaflet';

// Define interface for internal map properties not exposed in TypeScript definitions
export interface LeafletMapInternal extends L.Map {
  _loaded?: boolean;
}

// Safe map access utility function
export function getMapFromLayer(layer: L.Layer): L.Map | null {
  try {
    // Access the map property safely without TypeScript errors
    const map = (layer as any)._map;
    return map || null;
  } catch (err) {
    console.error('Error accessing map from layer:', err);
    return null;
  }
}

// Utility to check if map is valid and in DOM
export function isMapValid(map: L.Map | null): boolean {
  if (!map) return false;
  
  try {
    // Check if map is loaded
    if (!(map as LeafletMapInternal)._loaded) {
      return false;
    }
    
    // Check if container exists and is in DOM
    const container = map.getContainer();
    return !!(container && document.body.contains(container));
  } catch (err) {
    console.error('Error validating map:', err);
    return false;
  }
}
