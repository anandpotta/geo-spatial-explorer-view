
import L from 'leaflet';

// Define interface for internal map properties not exposed in TypeScript definitions
interface LeafletMapInternal extends L.Map {
  _loaded?: boolean;
  _container?: HTMLElement;
}

/**
 * Gets the map instance from a layer if possible
 * @param layer The Leaflet layer to get the map from
 * @returns The map instance or null if not found
 */
export const getMapFromLayer = (layer: any): L.Map | null => {
  if (!layer) return null;
  
  try {
    // First check if layer has _map property directly
    if (layer._map) return layer._map;
    
    // Check if layer has getMap method
    if (layer.getMap && typeof layer.getMap === 'function') {
      return layer.getMap();
    }
    
    // Try to access map through group
    if (layer._group && layer._group._map) {
      return layer._group._map;
    }
    
    // For feature groups, try to get map from first child layer
    if (layer.getLayers && typeof layer.getLayers === 'function') {
      const layers = layer.getLayers();
      if (layers.length > 0) {
        for (const childLayer of layers) {
          const map = getMapFromLayer(childLayer);
          if (map) return map;
        }
      }
    }
    
    return null;
  } catch (err) {
    console.error('Error accessing map from layer:', err);
    return null;
  }
};

/**
 * Checks if a map instance is valid and ready for interaction
 * @param map The Leaflet map to validate
 * @returns Whether the map is valid and ready
 */
export const isMapValid = (map: L.Map | null): boolean => {
  if (!map) return false;
  
  try {
    // Cast to internal map type to access private properties
    const internalMap = map as LeafletMapInternal;
    
    // Check if map has required properties
    if (!internalMap._loaded) return false;
    
    // Check if map container exists and is in the DOM
    const container = map.getContainer();
    if (!container || !document.body.contains(container)) {
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error validating map:', err);
    return false;
  }
};
