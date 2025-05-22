
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
    
    // Clear all SVG elements from all potential Leaflet panes
    const allPanes = container.querySelectorAll('.leaflet-pane');
    allPanes.forEach(pane => {
      // Target all SVG elements in each pane
      const svgElements = pane.querySelectorAll('svg');
      svgElements.forEach(svg => {
        // Clear all paths
        svg.querySelectorAll('path').forEach(path => {
          if (path.parentNode) {
            path.parentNode.removeChild(path);
          }
        });
        
        // Clear image elements (floor plans, etc.)
        svg.querySelectorAll('image').forEach(img => {
          if (img.parentNode) {
            img.parentNode.removeChild(img);
          }
        });
        
        // Clear any other potential SVG elements
        svg.querySelectorAll('g, rect, circle, polygon, polyline').forEach(element => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
        
        // Clear clip paths
        svg.querySelectorAll('clipPath').forEach(clipPath => {
          if (clipPath.parentNode) {
            clipPath.parentNode.removeChild(clipPath);
          }
        });
        
        // Clear defs elements that might contain clip paths
        svg.querySelectorAll('defs').forEach(def => {
          if (def.parentNode) {
            def.parentNode.removeChild(def);
          }
        });
      });
      
      // Clear all leaflet-zoom-animated elements
      pane.querySelectorAll('.leaflet-zoom-animated').forEach(element => {
        // Remove all children of these elements
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
      });
      
      // Clear marker images directly
      pane.querySelectorAll('.leaflet-marker-icon, .leaflet-marker-shadow').forEach(marker => {
        if (marker.parentNode) {
          marker.parentNode.removeChild(marker);
        }
      });
    });
    
    // Double check for any remaining SVG elements in the overlay pane
    const overlayPane = container.querySelector('.leaflet-overlay-pane');
    if (overlayPane) {
      Array.from(overlayPane.children).forEach(child => {
        overlayPane.removeChild(child);
      });
    }
    
    // Ensure the marker pane is also cleared
    const markerPane = container.querySelector('.leaflet-marker-pane');
    if (markerPane) {
      Array.from(markerPane.children).forEach(child => {
        markerPane.removeChild(child);
      });
    }
    
    // Clean up any vector panes that might contain SVG elements
    const vectorPane = container.querySelector('.leaflet-vector-pane');
    if (vectorPane) {
      Array.from(vectorPane.children).forEach(child => {
        vectorPane.removeChild(child);
      }); 
    }
    
    // Reset all paths in the map object directly
    if (map._pathRoot) {
      while (map._pathRoot.firstChild) {
        map._pathRoot.removeChild(map._pathRoot.firstChild);
      }
    }
    
    // Force a map redraw
    if (typeof map._updatePathViewport === 'function') {
      map._updatePathViewport();
    }
    
    // Trigger events to notify components
    console.log('Dispatching SVG paths cleared events');
    window.dispatchEvent(new Event('svgPathsCleared'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
    
    // Add a slight delay then refresh the map
    setTimeout(() => {
      try {
        if (map.invalidateSize) {
          map.invalidateSize({ pan: false });
        }
        if (map._resetView && map.getCenter && map.getZoom) {
          map._resetView(map.getCenter(), map.getZoom(), true);
        }
        map.fire('moveend');
        map.fire('zoomend');
      } catch (e) {
        console.error('Error refreshing map after clearing elements:', e);
      }
    }, 50);
  } catch (err) {
    console.error('Error clearing SVG elements from map:', err);
  }
};
