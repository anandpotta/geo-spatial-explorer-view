
import L from 'leaflet';

/**
 * Gets the map instance from a layer
 */
export function getMapFromLayer(layer: L.Layer): L.Map | null {
  if (!layer) return null;
  
  // Try the _map property first (most common)
  if ((layer as any)._map) {
    return (layer as any)._map;
  }
  
  // For feature groups, try to get the map from the first layer
  if ('getLayers' in layer && typeof (layer as any).getLayers === 'function') {
    const layers = (layer as any).getLayers();
    if (layers.length > 0 && layers[0]._map) {
      return layers[0]._map;
    }
  }
  
  return null;
}

/**
 * Checks if a map instance is valid
 */
export function isMapValid(map: L.Map | null): boolean {
  if (!map) return false;
  
  // Check if the map is loaded
  if (!(map as any)._loaded) {
    return false;
  }
  
  // Check if the map container exists and is in the DOM
  const container = map.getContainer();
  if (!container || !document.body.contains(container)) {
    return false;
  }
  
  return true;
}
