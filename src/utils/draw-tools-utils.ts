
import L from 'leaflet';

/**
 * Configures the SVG renderer for Leaflet drawing tools to prevent flickering
 */
export const configureSvgRenderer = (): (() => void) => {
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
      
      // Store the layer type as an attribute for easier selection
      if (layer._latlng && !layer._path.hasAttribute('data-shape-type')) {
        // It's a circle
        layer._path.setAttribute('data-shape-type', 'circle');
      } else if (layer._latlngs && !layer._path.hasAttribute('data-shape-type')) {
        // It's a polygon/rectangle
        layer._path.setAttribute('data-shape-type', 'polygon');
      }
    }
  };

  // Store the original Circle initialize method for cleanup
  let originalCircleInitialize: any = null;

  // Specific patch for Circle to ensure SVG rendering
  if (L.Circle && (L.Circle.prototype as any).initialize) {
    // Store original initialization method
    originalCircleInitialize = (L.Circle.prototype as any).initialize;
    
    // Override the initialize method
    (L.Circle.prototype as any).initialize = function() {
      // Call original initialization
      originalCircleInitialize.apply(this, arguments);
      
      // Force SVG renderer
      this.options.renderer = L.svg();
      this.options.stroke = true;
      this.options.opacity = 1;
    };
  }

  // Return a cleanup function
  return () => {
    // Restore original methods when component unmounts
    (L.SVG.prototype as any)._updateStyle = originalUpdateStyle;
    if (originalCircleInitialize && L.Circle && (L.Circle.prototype as any).initialize) {
      (L.Circle.prototype as any).initialize = originalCircleInitialize;
    }
  };
};

/**
 * Optimizes polygon rendering during drawing to prevent flickering
 */
export const optimizePolygonDrawing = () => {
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
};

/**
 * Enhances path elements to preserve SVG data during drawing
 */
export const enhancePathPreservation = (map: L.Map): () => void => {
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
};

/**
 * Ensures that circles are rendered as SVG paths
 */
export const ensureCircleSvgRendering = (map: L.Map): void => {
  if (!map) return;
  
  // Override the Circle class to use SVG renderer
  if (L.Circle && (L.Circle.prototype as any).initialize) {
    // Force SVG renderer for all circles
    const originalCircleInitialize = (L.Circle.prototype as any).initialize;
    
    (L.Circle.prototype as any).initialize = function() {
      // Call original initialization
      originalCircleInitialize.apply(this, arguments);
      
      // Explicitly set renderer to SVG
      this.options.renderer = L.svg();
    };
  }
  
  // Additionally, ensure the Draw.Circle class uses SVG
  if (L.Draw && (L.Draw as any).Circle) {
    const circleProto = (L.Draw as any).Circle.prototype;
    if (circleProto) {
      // Force SVG renderer in options
      if (circleProto.options && circleProto.options.shapeOptions) {
        circleProto.options.shapeOptions.renderer = L.svg();
      }
    }
  }
};
