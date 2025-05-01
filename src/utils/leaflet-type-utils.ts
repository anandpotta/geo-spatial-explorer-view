
import L from 'leaflet';

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
 * Checks if a map instance is valid
 */
export const isMapValid = (map: L.Map | null | undefined): boolean => {
  if (!map) return false;
  
  try {
    // Check if container exists and is in the DOM
    const container = map.getContainer();
    return !!container && document.body.contains(container);
  } catch (err) {
    return false;
  }
};
