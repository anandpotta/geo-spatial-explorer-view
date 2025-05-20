
import L from 'leaflet';

/**
 * Enhances rectangle rendering
 */
export const enhanceRectangleDrawing = () => {
  // Only enhance if Rectangle exists
  if (L.Draw && (L.Draw as any).Rectangle) {
    // Store original _drawShape method
    const originalDrawShape = (L.Draw as any).Rectangle.prototype._drawShape;
    
    if (originalDrawShape) {
      // Override the _drawShape method to enhance rectangle rendering
      (L.Draw as any).Rectangle.prototype._drawShape = function(latlng: any) {
        // Call original method
        originalDrawShape.call(this, latlng);
        
        // Apply additional enhancements to ensure path is rendered as SVG
        if (this._shape && this._shape._path) {
          // Add visibility classes
          this._shape._path.classList.add('visible-path-stroke');
          this._shape._path.classList.add('leaflet-drawing');
          
          // Force hardware acceleration
          this._shape._path.style.transform = 'translateZ(0)';
          this._shape._path.style.willChange = 'transform';
          
          // Ensure path properties are set
          this._shape._path.setAttribute('stroke-linecap', 'round');
          this._shape._path.setAttribute('stroke-linejoin', 'round');
          this._shape._path.setAttribute('vector-effect', 'non-scaling-stroke');
          this._shape._path.setAttribute('stroke-width', '4px');
          
          // Force a reflow
          this._shape._path.getBoundingClientRect();
        }
      };
    }
    
    return originalDrawShape;
  }
  
  return null;
};
