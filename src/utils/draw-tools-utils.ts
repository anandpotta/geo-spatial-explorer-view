import L from 'leaflet';

// Add the getCorners method to the LatLngBounds prototype
// We need to extend the LatLngBounds type definition first
declare module 'leaflet' {
  interface LatLngBounds {
    getCorners(): L.LatLng[];
  }
}

/**
 * Fixes the "type is not defined" error in the Leaflet Draw library's area calculation
 */
export const fixTypeIsNotDefinedError = (): () => void => {
  // Fix the "type is not defined" error in L.GeometryUtil.readableArea
  if (L.GeometryUtil && L.GeometryUtil.readableArea) {
    const originalReadableArea = L.GeometryUtil.readableArea;
    
    // Override with a fixed version that avoids the 'type is not defined' error
    L.GeometryUtil.readableArea = function(area: number, isMetric: boolean, precision?: any) {
      // The original function tries to use 'type' which is undefined
      // We'll implement a fixed version
      const areaStr = area.toFixed(2);
      const metricUnit = 'm²';
      const imperialUnit = 'ft²';
      
      if (isMetric) {
        if (area >= 10000) {
          return (area / 10000).toFixed(2) + ' ha';
        }
        return areaStr + ' ' + metricUnit;
      } else {
        // Convert to square feet
        const sqFeet = area * 10.7639;
        if (sqFeet > 43560) {
          // Convert to acres (43560 sq feet per acre)
          return (sqFeet / 43560).toFixed(2) + ' acres';
        }
        return sqFeet.toFixed(2) + ' ' + imperialUnit;
      }
    };
    
    return () => {
      // Restore original function
      L.GeometryUtil.readableArea = originalReadableArea;
    };
  }
  
  // If the function doesn't exist (which would be strange), create it
  else if (L.GeometryUtil && !L.GeometryUtil.readableArea) {
    L.GeometryUtil.readableArea = function(area: number, isMetric: boolean) {
      const areaStr = area.toFixed(2);
      return isMetric ? areaStr + ' m²' : (area * 10.7639).toFixed(2) + ' ft²';
    };
    
    return () => {
      // Clean up by deleting our added function
      if (L.GeometryUtil) {
        delete L.GeometryUtil.readableArea;
      }
    };
  }
  
  // Fallback empty cleanup function
  return () => {};
};

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
            const area = L.GeometryUtil.geodesicArea(this._getCorners(bounds));
            const areaText = L.GeometryUtil.readableArea(area, true);
            result.text = result.text.replace(/\{[^\}]*\}/, areaText);
          }
          return result;
        };
      }
      
      // Add a method to get corners from bounds to the Rectangle prototype
      if (!(L.Draw as any).Rectangle.prototype._getCorners) {
        (L.Draw as any).Rectangle.prototype._getCorners = function(bounds: L.LatLngBounds) {
          const northwest = bounds.getNorthWest();
          const northeast = bounds.getNorthEast();
          const southeast = bounds.getSouthEast();
          const southwest = bounds.getSouthWest();
          return [northwest, northeast, southeast, southwest, northwest];
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
    
    return originalOnMarkerDrag;
  }
  
  return null;
};

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

/**
 * Enhances path elements to preserve SVG data during drawing
 */
export const enhancePathPreservation = (map: L.Map): () => void => {
  if (!map) return () => {};
  
  // Add rectangle enhancement
  const originalRectDrawShape = enhanceRectangleDrawing();
  
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
                
                // Add visibility class
                path.classList.add('visible-path-stroke');
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
    
    // Restore original methods
    if (originalRectDrawShape && L.Draw && (L.Draw as any).Rectangle) {
      (L.Draw as any).Rectangle.prototype._drawShape = originalRectDrawShape;
    }
  };
};
