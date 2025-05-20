
import L from 'leaflet';

// Extend the LatLngBounds type to include our custom method
declare module 'leaflet' {
  interface LatLngBounds {
    getCorners(): L.LatLng[];
  }
}

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

  // Force SVG renderer for Draw control
  if (L.Draw) {
    // Force SVG renderer for Rectangle
    if ((L.Draw as any).Rectangle) {
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
      
      // Fix Rectangle rendering
      const originalRect = (L.Draw as any).Rectangle.prototype._drawShape;
      if (originalRect) {
        (L.Draw as any).Rectangle.prototype._drawShape = function(latlng: any) {
          originalRect.call(this, latlng);
          
          // Force SVG rendering after rectangle shape is drawn
          if (this._shape && this._shape._path) {
            this._shape._path.classList.add('leaflet-drawing');
            this._shape._path.style.transform = 'translateZ(0)';
            this._shape._path.style.willChange = 'transform';
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
            
            // Use our properly defined getCorners method
            const corners = [
              bounds.getNorthWest(),
              bounds.getNorthEast(),
              bounds.getSouthEast(),
              bounds.getSouthWest(),
              bounds.getNorthWest()
            ];
            
            const area = L.GeometryUtil.geodesicArea(corners);
            const areaText = L.GeometryUtil.readableArea(area, true);
            result.text = result.text.replace(/\{[^\}]*\}/, areaText);
          }
          return result;
        };
      }
    }

    // Force SVG renderer for Circle
    if ((L.Draw as any).Circle) {
      const originalInitialize = (L.Draw as any).Circle.prototype.initialize;
      (L.Draw as any).Circle.prototype.initialize = function() {
        originalInitialize.apply(this, arguments);
        if (this.options && this.options.shapeOptions) {
          this.options.shapeOptions.renderer = L.svg();
        }
      };
    }

    // Force SVG renderer for Polygon
    if ((L.Draw as any).Polygon) {
      const originalInitialize = (L.Draw as any).Polygon.prototype.initialize;
      (L.Draw as any).Polygon.prototype.initialize = function() {
        originalInitialize.apply(this, arguments);
        if (this.options && this.options.shapeOptions) {
          this.options.shapeOptions.renderer = L.svg();
        }
      };
    }
  }

  // Add LatLngBounds.getCorners method if it doesn't exist
  if (L.LatLngBounds && !L.LatLngBounds.prototype.getCorners) {
    L.LatLngBounds.prototype.getCorners = function() {
      const northwest = this.getNorthWest();
      const northeast = this.getNorthEast();
      const southeast = this.getSouthEast();
      const southwest = this.getSouthWest();
      return [northwest, northeast, southeast, southwest, northwest];
    };
  }

  // Return a cleanup function
  return () => {
    // Restore original method when component unmounts
    (L.SVG.prototype as any)._updateStyle = originalUpdateStyle;

    // Clean up LatLngBounds enhancement
    if (L.LatLngBounds && L.LatLngBounds.prototype.getCorners) {
      delete L.LatLngBounds.prototype.getCorners;
    }
  };
};
