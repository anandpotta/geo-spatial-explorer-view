
/**
 * Utility functions for working with SVG paths
 */

/**
 * Extracts path data from SVG elements in a container
 */
export const extractSvgPaths = (container: HTMLElement | null): string[] => {
  if (!container) return [];
  
  const paths: string[] = [];
  try {
    // Find all path elements
    const pathElements = container.querySelectorAll('path');
    pathElements.forEach(path => {
      const pathData = path.getAttribute('d');
      if (pathData) {
        paths.push(pathData);
      }
    });
  } catch (err) {
    console.error('Error extracting SVG paths:', err);
  }
  
  return paths;
};

/**
 * Gets a Leaflet layer's SVG path data
 */
export const getLeafletLayerPath = (layer: any): string | null => {
  if (!layer) return null;
  
  try {
    // Direct access to path element
    if (layer._path) {
      return layer._path.getAttribute('d') || null;
    }
    
    // For feature groups, check each sublayer
    if (typeof layer.eachLayer === 'function') {
      let pathData: string | null = null;
      layer.eachLayer((subLayer: any) => {
        if (!pathData && subLayer._path) {
          pathData = subLayer._path.getAttribute('d') || null;
        }
      });
      return pathData;
    }
  } catch (err) {
    console.error('Error getting layer path data:', err);
  }
  
  return null;
};

/**
 * Finds all SVG path elements on the map
 */
export const findAllPathsInMap = (map: any): SVGPathElement[] => {
  if (!map || !map.getContainer) return [];
  
  try {
    const container = map.getContainer();
    if (!container) return [];
    
    // Find all SVG path elements
    const svgLayers = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg');
    const paths: SVGPathElement[] = [];
    
    svgLayers.forEach(svg => {
      const pathsInSvg = svg.querySelectorAll('path');
      pathsInSvg.forEach(path => paths.push(path));
    });
    
    return paths;
  } catch (err) {
    console.error('Error finding SVG paths in map:', err);
    return [];
  }
};

/**
 * Get path data from all paths on the map
 */
export const getAllMapPathData = (map: any): string[] => {
  const paths = findAllPathsInMap(map);
  return paths.map(path => path.getAttribute('d') || '').filter(Boolean);
};

/**
 * Clear all SVG paths and image elements from the map
 */
export const clearAllMapSvgElements = (map: any): void => {
  if (!map || !map.getContainer) return;
  
  try {
    const container = map.getContainer();
    if (!container) return;
    
    console.log('Clearing all SVG elements from map container');
    
    // Clear SVG paths
    const svgLayers = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg');
    svgLayers.forEach(svg => {
      // Clear all paths that aren't tile boundaries
      const paths = svg.querySelectorAll('path');
      paths.forEach(path => {
        // Check if it's not a tile boundary path before removing
        if (!path.classList.contains('leaflet-tile-boundary')) {
          if (path.parentNode) {
            path.parentNode.removeChild(path);
          }
        }
      });
      
      // Clear image elements (floor plans, etc.)
      const images = svg.querySelectorAll('image');
      images.forEach(img => {
        if (img.parentNode) {
          img.parentNode.removeChild(img);
        }
      });
      
      // Clear clip paths
      const clipPaths = svg.querySelectorAll('clipPath');
      clipPaths.forEach(clipPath => {
        if (clipPath.parentNode) {
          clipPath.parentNode.removeChild(clipPath);
        }
      });
      
      // Clear defs elements that might contain clip paths
      const defs = svg.querySelectorAll('defs');
      defs.forEach(def => {
        if (def.parentNode) {
          def.parentNode.removeChild(def);
        }
      });
    });
    
    // Remove any other custom overlays
    const overlayPanes = container.querySelectorAll('.leaflet-overlay-pane, .leaflet-marker-pane');
    overlayPanes.forEach(pane => {
      // Preserve the pane itself but clear contents except SVG elements (already handled)
      Array.from(pane.children).forEach(child => {
        if (child.tagName !== 'SVG') {
          pane.removeChild(child);
        }
      });
    });
    
    // Trigger events to notify components
    console.log('Dispatching SVG paths cleared events');
    window.dispatchEvent(new Event('svgPathsCleared'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
  } catch (err) {
    console.error('Error clearing SVG elements from map:', err);
  }
};
