
import { useEffect } from 'react';
import L from 'leaflet';

/**
 * Hook to configure SVG renderer and optimize polygon drawing
 */
export function useSvgRenderer(featureGroup: L.FeatureGroup) {
  useEffect(() => {
    if (!featureGroup) return;
    
    // Fix: Don't use getMap as it doesn't exist on FeatureGroup
    // Use type assertion to access _map internally without TypeScript errors
    const map = (featureGroup as any)._map;
    if (!map) return;
    
    // Set up SVG renderer configuration to reduce flickering
    const cleanupSvgRenderer = configureSvgRenderer();
    
    // Optimize polygon drawing specifically
    const originalOnMarkerDrag = optimizePolygonDrawing();
    
    // Set up path preservation
    const cleanupPathPreservation = enhancePathPreservation(map);
    
    // Apply additional anti-flickering CSS to the map container
    const mapContainer = map.getContainer();
    if (mapContainer) {
      mapContainer.classList.add('optimize-svg-rendering');
      
      // Add a style element with our anti-flicker CSS
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        .optimize-svg-rendering .leaflet-overlay-pane svg {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
        .leaflet-drawing {
          stroke-linecap: round;
          stroke-linejoin: round;
          vector-effect: non-scaling-stroke;
        }
        .leaflet-interactive {
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        .image-controls-wrapper {
          opacity: 1 !important;
          transition: opacity 0.2s ease-in-out;
          z-index: 1000 !important;
          pointer-events: auto !important;
        }
        .persistent-control {
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
        }
        .visible-path-stroke {
          stroke-width: 4px !important;
          stroke: #33C3F0 !important;
          stroke-opacity: 1 !important;
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
          fill-opacity: 0.3 !important;
          vector-effect: non-scaling-stroke;
        }
        .leaflet-overlay-pane path.leaflet-interactive {
          stroke-width: 4px !important;
          stroke-opacity: 1 !important;
        }
      `;
      document.head.appendChild(styleEl);
      
      // Force a reflow to ensure the browser acknowledges these changes
      mapContainer.getBoundingClientRect();
    }
    
    // Set up a MutationObserver to watch for SVG changes and preserve paths
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.target.nodeName === 'svg') {
          // Use type assertion to correctly type the SVG element
          const svgElement = mutation.target as SVGElement;
          const paths = svgElement.querySelectorAll('path.leaflet-interactive');
          paths.forEach(path => {
            if (!path.classList.contains('visible-path-stroke')) {
              path.classList.add('visible-path-stroke');
            }
          });
        }
      });
    });
    
    // Set up event listeners for map interactions that might affect paths
    const handleMapInteraction = () => {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        if (featureGroup) {
          const paths = document.querySelectorAll('.leaflet-overlay-pane path.leaflet-interactive');
          paths.forEach(path => {
            if (!path.classList.contains('visible-path-stroke')) {
              path.classList.add('visible-path-stroke');
            }
          });
        }
      });
    };
    
    // Listen for events that might cause path visibility issues
    map.on('zoomend moveend dragend', handleMapInteraction);
    
    // Observe SVG elements in the overlay pane
    const overlayPane = map.getContainer().querySelector('.leaflet-overlay-pane');
    if (overlayPane) {
      observer.observe(overlayPane, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['d', 'class', 'style']
      });
    }
    
    // Also check after a short delay to catch any paths that might appear after initial drawing
    const checkPathsInterval = setInterval(() => {
      handleMapInteraction();
    }, 1000);
    
    // Cleanup function
    return () => {
      cleanupSvgRenderer();
      cleanupPathPreservation();
      observer.disconnect();
      map.off('zoomend moveend dragend', handleMapInteraction);
      clearInterval(checkPathsInterval);
      
      // Restore original marker drag handler if it was modified
      if (originalOnMarkerDrag && L.Edit && (L.Edit as any).Poly) {
        (L.Edit as any).Poly.prototype._onMarkerDrag = originalOnMarkerDrag;
      }
      
      // Remove the style element
      const styles = document.querySelectorAll('style');
      styles.forEach(style => {
        if (style.innerHTML.includes('optimize-svg-rendering')) {
          document.head.removeChild(style);
        }
      });
      
      // Remove the class from map container
      if (mapContainer) {
        mapContainer.classList.remove('optimize-svg-rendering');
      }
    };
  }, [featureGroup]);

  return null;
}

/**
 * Configures the SVG renderer for Leaflet drawing tools to prevent flickering
 */
function configureSvgRenderer(): () => void {
  // Store original _updateStyle method if it exists
  const originalUpdateStyle = (L.SVG.prototype as any)._updateStyle;

  // Override the _updateStyle method to add anti-flickering improvements
  (L.SVG.prototype as any)._updateStyle = function(layer: any) {
    // Call the original method first
    originalUpdateStyle.call(this, layer);

    // Apply additional styling to reduce flickering
    if (layer._path) {
      // Set rendering optimizations
      layer._path.setAttribute('shape-rendering', 'geometricPrecision');
      
      // Add a small transition to smooth any flickering
      layer._path.style.transition = 'stroke-dashoffset 0.1s';
      
      // Force the browser to acknowledge the SVG element to avoid rendering glitches
      layer._path.getBoundingClientRect();
      
      // Enhance rendering with additional properties
      layer._path.style.willChange = 'transform';
      layer._path.style.transform = 'translateZ(0)';
      
      // Add a drawing-specific class for custom CSS if needed
      if (!layer._path.classList.contains('leaflet-drawing')) {
        layer._path.classList.add('leaflet-drawing');
      }
    }
  };

  // Return a cleanup function
  return () => {
    // Restore original method when component unmounts
    (L.SVG.prototype as any)._updateStyle = originalUpdateStyle;
  };
}

/**
 * Optimizes polygon rendering during drawing to prevent flickering
 */
function optimizePolygonDrawing() {
  // Check if Edit.Poly.prototype exists and hasn't been modified yet
  if (L.Edit && (L.Edit as any).Poly && (L.Edit as any).Poly.prototype) {
    // Store original _onMarkerDrag method
    const originalOnMarkerDrag = (L.Edit as any).Poly.prototype._onMarkerDrag;
    
    // Override the marker drag event to prevent excessive redraws
    (L.Edit as any).Poly.prototype._onMarkerDrag = function(e: any) {
      // Call the original method
      originalOnMarkerDrag.call(this, e);
      
      // Apply additional optimizations
      if (this._poly && this._poly._path) {
        // Force hardware acceleration to reduce flickering
        this._poly._path.style.transform = 'translateZ(0)';
        
        // Ensure high-quality rendering
        this._poly._path.style.willChange = 'transform';
        
        // Add additional anti-flicker properties
        this._poly._path.style.backfaceVisibility = 'hidden';
        this._poly._path.style.perspective = '1000px';
      }
    };
    
    // Return the original method to allow for cleanup
    return originalOnMarkerDrag;
  }
  
  return null;
}

/**
 * Enhances path elements to preserve SVG data during drawing
 */
function enhancePathPreservation(map: L.Map): () => void {
  if (!map) return () => {};
  
  // Create a mutation observer to watch for newly added SVG paths
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          // Check if the added node contains SVG paths
          if (node instanceof Element) {
            const paths = node.querySelectorAll('path.leaflet-interactive');
            paths.forEach((path) => {
              // Store the original path data for retrieval
              const pathData = path.getAttribute('d');
              if (pathData) {
                path.setAttribute('data-original-path', pathData);
                
                // Apply performance optimizations
                path.setAttribute('shape-rendering', 'geometricPrecision');
                (path as HTMLElement).style.transform = 'translateZ(0)';
              }
            });
          }
        });
      }
    });
  });
  
  // Start observing the map container for SVG changes
  const container = map.getContainer();
  if (container) {
    observer.observe(container, { 
      childList: true, 
      subtree: true 
    });
  }
  
  // Return cleanup function
  return () => {
    observer.disconnect();
  };
}
