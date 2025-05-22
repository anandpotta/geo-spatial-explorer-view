
import L from 'leaflet';

/**
 * Safely checks if a map instance is valid and ready for use
 */
export function isMapValid(map: any): map is L.Map {
  if (!map) return false;
  
  // Check if map instance exists and has required methods
  if (typeof map.getContainer !== 'function') return false;
  if (typeof map.invalidateSize !== 'function') return false;
  
  try {
    // Check if the container element exists in the DOM
    const container = map.getContainer();
    if (!container || !document.body.contains(container)) {
      return false;
    }
    
    // Check if the map has been destroyed
    if ((map as any)._isDestroyed === true) {
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
 * Gets the map instance from a layer
 */
export function getMapFromLayer(layer: L.Layer | null): L.Map | null {
  if (!layer) return null;
  
  try {
    // Check if layer has a _map property
    if ((layer as any)._map) {
      return (layer as any)._map;
    }
    
    // For feature groups, check the first layer
    if (layer instanceof L.FeatureGroup && layer.getLayers().length > 0) {
      const firstLayer = layer.getLayers()[0];
      if ((firstLayer as any)._map) {
        return (firstLayer as any)._map;
      }
    }
    
    return null;
  } catch (err) {
    console.error("Error getting map from layer:", err);
    return null;
  }
}

/**
 * Checks if the map pane is initialized and ready for operations
 */
export function isMapPaneReady(map: L.Map | null): boolean {
  if (!map) return false;
  
  try {
    // Check if map is valid first
    if (!isMapValid(map)) return false;
    
    // Check if map pane exists and has position
    const mapPane = map.getPane('mapPane');
    if (!mapPane) return false;
    
    // Check if _leaflet_pos exists to prevent the specific error
    return !!(mapPane as any)._leaflet_pos;
  } catch (err) {
    console.warn('Error checking map pane readiness:', err);
    return false;
  }
}

/**
 * Safe operation wrapper to protect against Leaflet errors
 */
export function safeMapOperation<T>(map: L.Map | null, operation: (map: L.Map) => T, fallback: T): T {
  if (!map || !isMapValid(map)) return fallback;
  
  try {
    return operation(map);
  } catch (err) {
    console.warn(`Map operation failed: ${err.message}`);
    return fallback;
  }
}

/**
 * Safely invalidates the map size with proper type checking
 */
export function safeInvalidateSize(map: any): void {
  if (!map) return;
  
  try {
    // First check if it's a valid map object
    if (isMapValid(map)) {
      map.invalidateSize(true);
    } else if (typeof map.invalidateSize === 'function') {
      // Fallback if it has the method but didn't pass full validation
      map.invalidateSize(true);
    } else {
      console.warn('Map object doesn\'t have invalidateSize method');
    }
  } catch (err) {
    console.warn('Error invalidating map size:', err);
  }
}
