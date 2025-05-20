
import L from 'leaflet';

/**
 * Configures the SVG renderer for Leaflet drawing tools to prevent flickering
 */
export const configureSvgRenderer = (): () => void => {
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
      
      // Ensure all path elements are properly configured for SVG
      if (layer.options && layer.options.fill !== false) {
        layer._path.setAttribute('fill-opacity', '0.6');
      }
      
      // Ensure stroke is visible - extra important for polygon drawing
      layer._path.style.stroke = layer.options.color || '#33C3F0';
      layer._path.style.strokeWidth = (layer.options.weight || 4) + 'px';
      layer._path.style.strokeOpacity = layer.options.opacity || 1;
    }
  };
  
  // Fix for CircleMarker initialization to make vertices more visible during polygon drawing
  try {
    // Store the original prototype method
    const originalCircleMarkerInitialize = (L.CircleMarker as any).prototype.initialize;
    
    // Only proceed if the initialize method exists
    if (originalCircleMarkerInitialize) {
      // Override the initialize method with proper type assertion
      (L.CircleMarker as any).prototype.initialize = function(...args: any[]) {
        // Call the original initialize method
        const result = originalCircleMarkerInitialize.apply(this, args);
        
        // Make vertex markers more visible when part of a drawing
        if (this.options && this.options.className && 
            this.options.className.includes('leaflet-draw-marker')) {
          this.options.radius = 6; // Larger radius for better visibility
          this.options.weight = 2; // Thicker border
          this.options.opacity = 1; // Full opacity
          this.options.color = '#33C3F0'; // Match drawing color
          this.options.fillColor = '#fff'; // White fill
          this.options.fillOpacity = 1; // Full fill opacity
        }
        
        return result;
      };
    }
  } catch (err) {
    console.error('Error configuring circle marker:', err);
  }

  // Return a cleanup function to restore original methods when component unmounts
  return () => {
    // Restore original _updateStyle method
    (L.SVG.prototype as any)._updateStyle = originalUpdateStyle;
    
    // Restore original CircleMarker initialize method
    try {
      const originalCircleMarkerInitialize = (L.CircleMarker as any).prototype.initialize;
      if (originalCircleMarkerInitialize) {
        (L.CircleMarker as any).prototype.initialize = originalCircleMarkerInitialize;
      }
    } catch (err) {
      console.error('Error restoring circle marker:', err);
    }
  };
};
