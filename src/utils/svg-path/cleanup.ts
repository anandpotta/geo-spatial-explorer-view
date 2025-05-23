import L from 'leaflet';

/**
 * Clear all SVG elements from the map's overlay pane
 * This is a more aggressive approach than just using clearLayers() 
 * as it directly removes elements from the DOM
 */
export function clearAllMapSvgElements(map: L.Map): void {
  if (!map) return;
  
  console.log('Clearing all SVG elements from map');
  
  try {
    // Get the container and overlay pane
    const container = map.getContainer();
    if (!container) return;
    
    // Clear SVG elements from overlay pane
    const overlayPane = container.querySelector('.leaflet-overlay-pane');
    if (overlayPane) {
      // Find all SVGs in the overlay pane
      const svgElements = Array.from(overlayPane.querySelectorAll('svg'));
      
      svgElements.forEach(svg => {
        // Remove all path elements within each SVG
        const paths = Array.from(svg.querySelectorAll('path'));
        paths.forEach(path => {
          try {
            if (path.parentNode) {
              path.parentNode.removeChild(path);
            } else {
              path.remove();
            }
          } catch (err) {
            console.error('Error removing path:', err);
          }
        });
        
        // Clean up empty g elements
        const gElements = Array.from(svg.querySelectorAll('g'));
        gElements.forEach(g => {
          if (!g.hasChildNodes()) {
            try {
              g.remove();
            } catch (err) {
              console.error('Error removing empty g element:', err);
            }
          }
        });
        
        // If the SVG is now empty (no child nodes), remove it
        if (svg.childNodes.length === 0) {
          try {
            svg.remove();
          } catch (err) {
            console.error('Error removing empty SVG:', err);
          }
        }
      });
      
      // As a fallback, also try to clear the innerHTML
      if (svgElements.length > 0) {
        try {
          // Force clear the entire overlay pane content and recreate fresh SVGs
          const originalHTML = overlayPane.innerHTML;
          overlayPane.innerHTML = '';
          
          // Create a new empty SVG element to replace the cleared content
          const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          newSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          newSvg.setAttribute('pointer-events', 'none');
          newSvg.setAttribute('class', 'leaflet-zoom-animated');
          overlayPane.appendChild(newSvg);
          
          // Add an empty g element
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          newSvg.appendChild(g);
        } catch (err) {
          console.error('Error with innerHTML fallback:', err);
        }
      }
    }
    
    // Also check the marker pane for any remnant elements
    const markerPane = container.querySelector('.leaflet-marker-pane');
    if (markerPane) {
      // Keep removing first child until pane is empty
      while (markerPane.firstChild) {
        markerPane.removeChild(markerPane.firstChild);
      }
    }
    
    // Clear shadow pane
    const shadowPane = container.querySelector('.leaflet-shadow-pane');
    if (shadowPane) {
      while (shadowPane.firstChild) {
        shadowPane.removeChild(shadowPane.firstChild);
      }
    }
    
    // Force a rerender of the map
    if (typeof map.invalidateSize === 'function') {
      setTimeout(() => {
        try {
          map.invalidateSize(true);
          // Also redraw the view using public API
          const center = map.getCenter();
          const zoom = map.getZoom();
          // Remove the invalid 'reset' property and use standard options
          map.setView(center, zoom, { animate: false, duration: 0 });
        } catch (err) {
          console.error('Error during map invalidation:', err);
        }
      }, 50);
    }
    
    console.log('Completed SVG element cleanup');
  } catch (err) {
    console.error('Error clearing SVG elements:', err);
  }
}
