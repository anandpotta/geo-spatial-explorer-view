
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
