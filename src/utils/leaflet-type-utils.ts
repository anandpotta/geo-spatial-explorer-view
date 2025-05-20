
import L from 'leaflet';

// Define interface for internal map properties not exposed in TypeScript definitions
export interface LeafletMapInternal extends L.Map {
  _layers?: { [key: string]: L.Layer };
  _leaflet_id?: number;
  _loaded?: boolean;
  _container?: HTMLElement;
  _panes?: {
    mapPane?: {
      _leaflet_pos?: any;
    };
    tilePane?: HTMLElement;
    shadowPane?: HTMLElement;
    markerPane?: HTMLElement;
    tooltipPane?: HTMLElement;
    popupPane?: HTMLElement;
    overlayPane?: HTMLElement;
  };
}

// Define type for extended layer properties instead of extending the Layer interface
export type ExtendedLayer = L.Layer & {
  options?: {
    isDrawn?: boolean;
    id?: string;
    data?: any;
  } & L.PathOptions;
  _path?: SVGPathElement;
  _map?: L.Map;
  _leaflet_id?: number;
};

/**
 * Checks if a map object is valid and ready for use
 * @param map The map instance to check
 * @returns boolean indicating if map is valid
 */
export function isMapValid(map: any): boolean {
  if (!map) return false;
  
  try {
    // Check if map has essential properties
    if (!map.getContainer || typeof map.getContainer !== 'function') return false;
    
    // Get container and check if it's in the DOM
    try {
      const container = map.getContainer();
      if (!container || !document.body.contains(container)) return false;
      
      // Check if the container is marked as inactive
      if (container.getAttribute('data-inactive') === 'true') {
        console.warn('Map container is marked as inactive');
        return false;
      }
      
      // Check if container is being reused
      if (container.getAttribute('data-in-use') === 'true') {
        const mapId = map._leaflet_id || '';
        const usedByMapId = container.getAttribute('data-used-by-map-id') || '';
        
        // If container is used by a different map instance, it's invalid
        if (usedByMapId && usedByMapId !== String(mapId)) {
          console.warn(`Container is being used by map ${usedByMapId}, not ${mapId}`);
          return false;
        }
      }
    } catch (err) {
      return false;
    }
    
    // Check if map has been loaded
    const internalMap = map as LeafletMapInternal;
    if (typeof internalMap._loaded !== 'undefined' && internalMap._loaded === false) return false;
    
    // Check if critical panes exist
    if (!internalMap._panes || !internalMap._panes.mapPane) return false;
    
    return true;
  } catch (err) {
    console.error('Error checking map validity:', err);
    return false;
  }
}

/**
 * Gets the map a layer is attached to
 * @param layer The layer to get the map from
 * @returns The map instance or null
 */
export function getMapFromLayer(layer: L.Layer | null): L.Map | null {
  if (!layer) return null;
  
  try {
    // Cast to any to access protected properties safely
    const extendedLayer = layer as any;
    
    // Try to access map directly
    if (extendedLayer._map) {
      return extendedLayer._map;
    }
    
    // If it's a feature group, try to get map from first layer
    if ('getLayers' in layer) {
      const featureGroup = layer as L.FeatureGroup;
      const layers = featureGroup.getLayers();
      if (layers.length > 0) {
        const firstLayer = layers[0] as any;
        if (firstLayer._map) {
          return firstLayer._map;
        }
      }
    }
    
    return null;
  } catch (err) {
    console.error('Error getting map from layer:', err);
    return null;
  }
}

/**
 * Creates a unique identifier for map instances
 * @returns A unique string ID
 */
export function createUniqueMapId(): string {
  return `map-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Checks if a map container is already in use by another map instance
 * @param container The DOM element to check
 * @param currentMapId ID of the current map instance
 * @returns boolean indicating if container is already in use
 */
export function isContainerInUse(container: HTMLElement, currentMapId: string): boolean {
  // Check if this container is already marked as in use
  if (container.getAttribute('data-in-use') === 'true') {
    const usedByMapId = container.getAttribute('data-used-by-map-id');
    if (usedByMapId && usedByMapId !== currentMapId) {
      console.warn(`Container is being used by map ${usedByMapId}, not ${currentMapId}`);
      return true;
    }
  }
  
  // Check if container is marked as inactive
  if (container.getAttribute('data-inactive') === 'true') {
    console.warn('Container is marked as inactive');
    return true;
  }
  
  return false;
}

export default { 
  isMapValid, 
  getMapFromLayer, 
  createUniqueMapId, 
  isContainerInUse 
};
