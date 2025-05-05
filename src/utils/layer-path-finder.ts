
import L from 'leaflet';

/**
 * Finds path element in a layer or its child layers
 */
export const findPathElementInLayer = (layer: any): SVGElement | null => {
  if (!layer) return null;
  
  try {
    // Direct access to path element
    if (layer._path) {
      return layer._path;
    }
    
    // For feature groups, check each sublayer
    if (typeof layer.eachLayer === 'function') {
      let pathElement: SVGElement | null = null;
      layer.eachLayer((subLayer: any) => {
        if (!pathElement && subLayer._path) {
          pathElement = subLayer._path;
        }
      });
      return pathElement;
    }
  } catch (err) {
    console.error('Error finding path element:', err);
  }
  
  return null;
};

/**
 * Gets SVG element containing the layer's path
 */
export const getSvgForLayer = (pathElement: SVGElement | null): SVGElement | null => {
  if (!pathElement) return null;
  return pathElement.closest('svg') || null;
};

/**
 * Finds the appropriate map container
 */
export const getMapContainer = (layer: any): HTMLElement | null => {
  if (!layer) return null;
  
  try {
    const map = layer._map;
    if (map && map.getContainer) {
      return map.getContainer();
    }
  } catch (err) {
    console.error('Error getting map container:', err);
  }
  
  return null;
};

/**
 * Finds the overlay pane in the map
 */
export const getOverlayPane = (map: L.Map | null): HTMLElement | null => {
  if (!map || !map.getPanes) return null;
  
  try {
    return map.getPanes().overlayPane || null;
  } catch (err) {
    console.error('Error getting overlay pane:', err);
    return null;
  }
};
