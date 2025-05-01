
import L from 'leaflet';

/**
 * Configures the SVG renderer for Leaflet drawing tools to prevent flickering
 */
export const configureSvgRenderer = (): () => void => {
  // Store original _updateStyle method
  const originalUpdateStyle = L.SVG.prototype._updateStyle;

  // Override the _updateStyle method to add anti-flickering improvements
  L.SVG.prototype._updateStyle = function(layer: any) {
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
      
      // Add a drawing-specific class for custom CSS if needed
      if (!layer._path.classList.contains('leaflet-drawing')) {
        layer._path.classList.add('leaflet-drawing');
      }
    }
  };

  // Return a cleanup function
  return () => {
    // Restore original method when component unmounts
    L.SVG.prototype._updateStyle = originalUpdateStyle;
  };
};

/**
 * Optimizes polygon rendering during drawing to prevent flickering
 */
export const optimizePolygonDrawing = () => {
  // Check if Edit.Poly.prototype exists and hasn't been modified yet
  if (L.Edit && L.Edit.Poly && L.Edit.Poly.prototype) {
    // Store original _onMarkerDrag method
    const originalOnMarkerDrag = L.Edit.Poly.prototype._onMarkerDrag;
    
    // Override the marker drag event to prevent excessive redraws
    L.Edit.Poly.prototype._onMarkerDrag = function(e: any) {
      // Call the original method
      originalOnMarkerDrag.call(this, e);
      
      // Apply additional optimizations
      if (this._poly && this._poly._path) {
        // Force hardware acceleration to reduce flickering
        this._poly._path.style.transform = 'translateZ(0)';
        
        // Ensure high-quality rendering
        this._poly._path.style.willChange = 'transform';
      }
    };
    
    // Return the original method to allow for cleanup
    return originalOnMarkerDrag;
  }
  
  return null;
};
