
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
    }
  };

  // Return a cleanup function
  return () => {
    // Restore original method when component unmounts
    (L.SVG.prototype as any)._updateStyle = originalUpdateStyle;
  };
};
