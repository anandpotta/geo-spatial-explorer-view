
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
    
    // First, try to clear layers from the map itself
    if (map && map.eachLayer) {
      console.log('Iterating through map layers to clear user-added layers');
      map.eachLayer((layer: any) => {
        // Skip tile layers and base layers
        if (layer._url || layer.options?.baseLayer) {
          return;
        }
        
        // Remove user-added layers
        if (layer.options?.isDrawn || layer.options?.id) {
          console.log('Removing user-added layer:', layer.options?.id || 'unnamed');
          map.removeLayer(layer);
        }
      });
    }
    
    // Clear SVG paths
    const svgLayers = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg, .leaflet-svg-layer');
    console.log(`Found ${svgLayers.length} SVG layers to process`);
    
    svgLayers.forEach(svg => {
      // Clear path elements
      const paths = svg.querySelectorAll('path:not(.leaflet-tile-boundary)');
      console.log(`Removing ${paths.length} path elements`);
      paths.forEach(path => path.remove());
      
      // Clear image elements (floor plans, etc.)
      const images = svg.querySelectorAll('image');
      console.log(`Removing ${images.length} image elements`);
      images.forEach(img => img.remove());
      
      // Clear clip paths
      const clipPaths = svg.querySelectorAll('clipPath');
      console.log(`Removing ${clipPaths.length} clip path elements`);
      clipPaths.forEach(clipPath => clipPath.remove());
      
      // Clear defs elements that might contain clip paths
      const defs = svg.querySelectorAll('defs');
      console.log(`Removing ${defs.length} defs elements`);
      defs.forEach(def => def.remove());
      
      // Clear g elements that might contain paths or images
      const groups = svg.querySelectorAll('g:not(.leaflet-tile-container)');
      console.log(`Checking ${groups.length} group elements`);
      groups.forEach(group => {
        // Only remove groups that contain our custom elements
        if (group.querySelector('image, clipPath, path:not(.leaflet-tile-boundary)')) {
          group.remove();
        }
      });
    });
    
    // Clear any elements in the Draw control
    const drawControl = container.querySelector('.leaflet-draw');
    if (drawControl) {
      console.log('Found draw control, clearing any SVG elements inside');
      const drawSvgs = drawControl.querySelectorAll('svg');
      drawSvgs.forEach(svg => {
        const paths = svg.querySelectorAll('path:not(.leaflet-tile-boundary)');
        paths.forEach(path => path.remove());
      });
    }
    
    // Clear all elements in the edit feature group if available
    if (window.featureGroup) {
      console.log('Clearing feature group');
      window.featureGroup.clearLayers();
    }
    
    // Trigger events to notify components
    console.log('Dispatching SVG paths cleared event');
    window.dispatchEvent(new Event('svgPathsCleared'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
    
    // Also remove svgPaths from localStorage to prevent reloading
    localStorage.removeItem('svgPaths');
    localStorage.removeItem('savedDrawings');
    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('floorPlans');
    
    // Dispatch storage event to ensure other components are notified
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error clearing SVG elements from map:', err);
  }
};
