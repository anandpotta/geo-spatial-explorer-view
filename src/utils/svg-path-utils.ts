
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
    
    // First, try to clear layers directly from the map
    if (map && map.eachLayer) {
      console.log('Iterating through map layers to clear user-added layers');
      map.eachLayer((layer: any) => {
        try {
          // Skip tile layers and base layers
          if (layer._url || layer.options?.baseLayer) {
            return;
          }
          
          // Check for drawn elements with more criteria
          const isDrawnLayer = layer.options?.isDrawn || 
                              layer.options?.id ||
                              layer.feature || 
                              layer._leaflet_id && !layer._url;
          
          if (isDrawnLayer) {
            console.log('Removing user-added layer:', layer.options?.id || 'unnamed');
            try {
              map.removeLayer(layer);
            } catch (err) {
              console.warn('Error removing layer:', err);
            }
          }
        } catch (err) {
          console.warn('Error processing layer:', err);
        }
      });
    }
    
    // Clear all SVG elements in all leaflet panels
    const allLeafletPanes = container.querySelectorAll('.leaflet-pane');
    console.log(`Found ${allLeafletPanes.length} leaflet panes to check`);
    
    allLeafletPanes.forEach(pane => {
      // Skip tile pane
      if (pane.classList.contains('leaflet-tile-pane')) return;
      
      // Clear SVG elements
      const svgs = pane.querySelectorAll('svg');
      console.log(`Found ${svgs.length} SVG elements in pane`);
      svgs.forEach(svg => {
        // Clear all paths except tile boundaries
        const paths = svg.querySelectorAll('path:not(.leaflet-tile-boundary)');
        console.log(`Removing ${paths.length} path elements`);
        paths.forEach(path => {
          try {
            path.parentNode?.removeChild(path);
          } catch (err) {
            console.warn('Error removing path:', err);
          }
        });
        
        // Clear all images
        const images = svg.querySelectorAll('image');
        console.log(`Removing ${images.length} image elements`);
        images.forEach(img => {
          try {
            img.parentNode?.removeChild(img);
          } catch (err) {
            console.warn('Error removing image:', err);
          }
        });
        
        // Clear all clip paths
        const clipPaths = svg.querySelectorAll('clipPath');
        console.log(`Removing ${clipPaths.length} clip path elements`);
        clipPaths.forEach(clipPath => {
          try {
            clipPath.parentNode?.removeChild(clipPath);
          } catch (err) {
            console.warn('Error removing clip path:', err);
          }
        });
        
        // Clear all defs elements
        const defs = svg.querySelectorAll('defs');
        console.log(`Removing ${defs.length} defs elements`);
        defs.forEach(def => {
          try {
            def.innerHTML = ''; // Clear contents first
            def.parentNode?.removeChild(def);
          } catch (err) {
            console.warn('Error removing defs:', err);
          }
        });
        
        // Clear non-tile-container groups
        const groups = svg.querySelectorAll('g:not(.leaflet-tile-container)');
        console.log(`Checking ${groups.length} group elements`);
        groups.forEach(group => {
          try {
            // Only remove groups with our custom elements
            if (group.querySelector('image, clipPath, path:not(.leaflet-tile-boundary)')) {
              group.parentNode?.removeChild(group);
            } else {
              // For other groups, clear their contents
              group.innerHTML = '';
            }
          } catch (err) {
            console.warn('Error removing group:', err);
          }
        });
        
        // Clear all user-added elements (more aggressive approach)
        svg.innerHTML = '';
        // Re-add essential elements if needed
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('leaflet-tile-container');
        svg.appendChild(g);
      });
      
      // Also check for and remove any marker divs
      const markerDivs = pane.querySelectorAll('.leaflet-marker-icon, .leaflet-marker-shadow');
      markerDivs.forEach(div => {
        try {
          div.parentNode?.removeChild(div);
        } catch (err) {
          console.warn('Error removing marker div:', err);
        }
      });
    });
    
    // Clear any feature group directly
    if (window.featureGroup) {
      console.log('Clearing feature group');
      try {
        window.featureGroup.clearLayers();
      } catch (err) {
        console.warn('Error clearing feature group:', err);
      }
    }
    
    // Force complete clearing of localStorage
    localStorage.removeItem('svgPaths');
    localStorage.removeItem('savedDrawings');
    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('floorPlans');
    
    // Dispatch events to ensure all components are updated
    console.log('Dispatching SVG paths cleared events');
    window.dispatchEvent(new Event('svgPathsCleared'));
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { cleared: true } }));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    
    // Fire map resize event to force redraw
    if (map.invalidateSize) {
      setTimeout(() => {
        try {
          map.invalidateSize({ animate: false });
          
          // Also fire these events after slight delay to ensure complete redraw
          map.fire('draw:deleted');
          map.fire('draw:editstop');
        } catch (err) {
          console.warn('Error invalidating map size:', err);
        }
      }, 100);
    }
    
  } catch (err) {
    console.error('Error clearing SVG elements from map:', err);
  }
};
