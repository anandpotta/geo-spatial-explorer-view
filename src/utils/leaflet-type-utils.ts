
import L from 'leaflet';

/**
 * Interface for internal Leaflet Map properties not exposed in TypeScript definitions
 */
export interface LeafletMapInternal extends L.Map {
  _layers?: Record<string, L.Layer>;
  _panes?: {
    mapPane?: {
      _leaflet_pos?: any;
    };
  };
}

/**
 * Extended interface for Leaflet LayerOptions with custom properties
 */
export interface ExtendedLayerOptions extends L.LayerOptions {
  isDrawn?: boolean;
  id?: string;
}

/**
 * Extended interface for Leaflet Layer with customized options
 */
export interface ExtendedLayer extends L.Layer {
  options: ExtendedLayerOptions;  // Changed from optional to required
}

/**
 * Safely gets the map from a Leaflet layer
 */
export const getMapFromLayer = (layer: L.Layer): L.Map | null => {
  if (!layer) return null;
  
  try {
    // Type assertion to access _map property
    const map = (layer as any)._map;
    if (map) return map;
    
    // Alternative approach for FeatureGroup
    if (typeof (layer as any).getLayer === 'function') {
      const firstLayer = (layer as any).getLayer(
        Object.keys((layer as any)._layers)[0]
      );
      if (firstLayer && firstLayer._map) {
        return firstLayer._map;
      }
    }
    
    return null;
  } catch (err) {
    console.error('Error getting map from layer:', err);
    return null;
  }
};

/**
 * Checks if a map instance is valid and fully initialized
 */
export const isMapValid = (map: L.Map | null | undefined): boolean => {
  if (!map) return false;
  
  try {
    // Check if container exists and is in the DOM
    const container = map.getContainer();
    if (!container || !document.body.contains(container)) {
      return false;
    }
    
    // Check if map panes are initialized
    const internalMap = map as LeafletMapInternal;
    if (!internalMap._panes || !internalMap._panes.mapPane) {
      return false;
    }
    
    // Check if position info is available
    if (!internalMap._panes.mapPane._leaflet_pos) {
      return false;
    }
    
    // Additional check: verify that the map actually has dimensions
    const size = map.getSize();
    if (!size || size.x === 0 || size.y === 0) {
      return false;
    }
    
    // If we pass all checks, the map should be valid
    return true;
  } catch (err) {
    console.error('Error validating map:', err);
    return false;
  }
};

/**
 * Safely execute a map operation with validation
 */
export const safeMapOperation = <T>(
  map: L.Map | null | undefined, 
  operation: (map: L.Map) => T,
  fallback: T
): T => {
  if (isMapValid(map)) {
    try {
      return operation(map as L.Map);
    } catch (err) {
      console.error('Map operation failed:', err);
      return fallback;
    }
  }
  return fallback;
};
