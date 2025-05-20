
import L from 'leaflet';

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
      if (originalOnMarkerDrag) {
        originalOnMarkerDrag.call(this, e);
      }
      
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
 * Sets up the edit handlers if they're missing
 */
export const setupEditHandlers = (): () => void => {
  const originalPoly = (L.Edit as any).Poly;
  
  if (!(L.Edit as any).Poly) {
    (L.Edit as any).Poly = L.Handler.extend({
      // Minimally required methods
      initialize: function(poly: any) {
        this._poly = poly;
      },
      addHooks: function() {
        if (this._poly._map) {
          if (!this._markerGroup) {
            this._initMarkers();
          }
          this._poly._map.addLayer(this._markerGroup);
        }
      },
      removeHooks: function() {
        if (this._poly._map) {
          this._poly._map.removeLayer(this._markerGroup);
        }
      },
      _initMarkers: function() {
        // Implementation depends on the specific edit functionality needed
        this._markerGroup = new L.LayerGroup();
      }
    });
  }
  
  return () => {
    // Restore original if it existed
    if (originalPoly) {
      (L.Edit as any).Poly = originalPoly;
    }
  };
};

/**
 * Configures additional drawing tools
 */
export const configureDrawingTools = (): () => void => {
  const cleanups: Array<() => void> = [];
  
  // Override polygon drawing to ensure vertex markers are visible
  if ((L.Draw as any).Polygon && (L.Draw as any).Polygon.prototype) {
    const originalAddVertex = (L.Draw as any).Polygon.prototype._addVertex;
    if (originalAddVertex) {
      (L.Draw as any).Polygon.prototype._addVertex = function(latlng: L.LatLng) {
        // Call original method
        const result = originalAddVertex.call(this, latlng);
        
        // Make sure markers are visible
        if (this._markers && this._markers.length > 0) {
          const lastMarker = this._markers[this._markers.length - 1];
          if (lastMarker) {
            // Force the marker to be more visible
            lastMarker.setStyle({
              radius: 6,
              weight: 2,
              color: '#33C3F0',
              fillColor: '#ffffff',
              fillOpacity: 1,
              opacity: 1
            });
            
            // Force a reflow to ensure styles are applied
            if (lastMarker._icon) {
              lastMarker._icon.getBoundingClientRect();
            }
          }
        }
        
        return result;
      };
      
      cleanups.push(() => {
        (L.Draw as any).Polygon.prototype._addVertex = originalAddVertex;
      });
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
    
    cleanups.push(() => {
      (L.Draw as any).Circle.prototype.initialize = originalInitialize;
    });
  }

  // Force SVG renderer for Polygon and improve visibility
  if ((L.Draw as any).Polygon) {
    const originalInitialize = (L.Draw as any).Polygon.prototype.initialize;
    (L.Draw as any).Polygon.prototype.initialize = function() {
      originalInitialize.apply(this, arguments);
      if (this.options && this.options.shapeOptions) {
        this.options.shapeOptions.renderer = L.svg(); // Force SVG renderer for polygons
      }
      
      // Enhance marker visibility for polygon drawing
      if (this.options) {
        // Ensure guide line is clearly visible
        if (this.options.guidelineDistance === undefined) {
          this.options.guidelineDistance = 10;
        }
        if (this.options.shapeOptions) {
          this.options.shapeOptions.weight = 4;
          this.options.shapeOptions.opacity = 1;
        }
      }
    };
    
    cleanups.push(() => {
      (L.Draw as any).Polygon.prototype.initialize = originalInitialize;
    });
  }
  
  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
};
