
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
    
    // Fix the showRadius property for rectangles
    const originalGetTooltipText = (L.Draw as any).Rectangle.prototype._getTooltipText;
    if (originalGetTooltipText) {
      (L.Draw as any).Rectangle.prototype._getTooltipText = function() {
        const result = originalGetTooltipText.call(this);
        // Make sure we don't reference 'type' directly
        if (result && result.text && this._shape) {
          const bounds = this._shape.getBounds();
          // Fix: Define our own corners array instead of relying on getCorners
          const corners = [
            bounds.getNorthWest(), 
            bounds.getNorthEast(), 
            bounds.getSouthEast(), 
            bounds.getSouthWest(),
            bounds.getNorthWest() // Close the polygon
          ];
          const area = L.GeometryUtil.geodesicArea(corners);
          const areaText = L.GeometryUtil.readableArea(area, true);
          result.text = result.text.replace(/\{[^\}]*\}/, areaText);
        }
        return result;
      };
    }
    
    // Force SVG renderer for Rectangle
    const originalInitialize = (L.Draw as any).Rectangle.prototype.initialize;
    (L.Draw as any).Rectangle.prototype.initialize = function() {
      originalInitialize.apply(this, arguments);
      if (this.options && this.options.shapeOptions) {
        this.options.shapeOptions.renderer = L.svg();
        // Add these explicit settings for rectangle
        this.options.shapeOptions.stroke = true;
        this.options.shapeOptions.lineCap = 'round';
        this.options.shapeOptions.lineJoin = 'round';
      }
    };
    
    return originalDrawShape;
  }
  
  return null;
};
