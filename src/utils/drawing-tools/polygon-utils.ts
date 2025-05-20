
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
  
  // Fix polygon drawing to improve marker visibility and connection line rendering
  if ((L.Draw as any).Polygon && (L.Draw as any).Polygon.prototype) {
    // Store original method so it can be restored later
    const originalVertexMarker = (L.Draw as any).Polygon.prototype._createMarker;
    
    // Override vertex marker creation to ensure it's created correctly
    if (originalVertexMarker) {
      (L.Draw as any).Polygon.prototype._createMarker = function(latlng: L.LatLng, index?: number) {
        // Create visible markers for each polygon vertex
        const marker = originalVertexMarker.call(this, latlng, index);
        
        if (marker) {
          // Make the marker more visible
          if (marker.options) {
            marker.options.radius = 6;
            marker.options.weight = 2;
            marker.options.color = '#33C3F0';
            marker.options.fillColor = '#fff';
            marker.options.fillOpacity = 1;
            marker.options.opacity = 1;
          }
          
          // Ensure the marker is interactive and visible
          if (marker._icon) {
            marker._icon.style.pointerEvents = 'auto';
            marker._icon.style.cursor = 'pointer';
            marker._icon.style.zIndex = '1000';
            // Force a reflow to ensure styles are applied
            marker._icon.getBoundingClientRect();
          }
        }
        
        return marker;
      };
      
      cleanups.push(() => {
        (L.Draw as any).Polygon.prototype._createMarker = originalVertexMarker;
      });
    }
    
    // Override _addVertex to ensure vertex markers display correctly
    const originalAddVertex = (L.Draw as any).Polygon.prototype._addVertex;
    
    if (originalAddVertex) {
      (L.Draw as any).Polygon.prototype._addVertex = function(latlng: L.LatLng) {
        // Call original method
        const result = originalAddVertex.call(this, latlng);
        
        // Make sure markers are visible and connection lines draw properly
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
        
        // Ensure polyline visibility between points
        if (this._poly && this._poly._path) {
          this._poly._path.style.stroke = 'rgba(51, 195, 240, 1)';
          this._poly._path.style.strokeWidth = '4px';
          this._poly._path.style.strokeDasharray = '';
          this._poly._path.style.strokeLinecap = 'round';
          this._poly._path.style.strokeLinejoin = 'round';
        }
        
        return result;
      };
      
      cleanups.push(() => {
        (L.Draw as any).Polygon.prototype._addVertex = originalAddVertex;
      });
    }
    
    // Fix _updateFinishHandler to ensure finish button works correctly
    const originalUpdateFinishHandler = (L.Draw as any).Polygon.prototype._updateFinishHandler;
    
    if (originalUpdateFinishHandler) {
      (L.Draw as any).Polygon.prototype._updateFinishHandler = function() {
        const result = originalUpdateFinishHandler.call(this);
        
        // Ensure the finish handler is visible and interactive
        if (this._markers && this._markers.length > 2) {
          if (this._finishShape) {
            // Make sure finish shape is called properly
            // Some versions of leaflet-draw have issues here
            const finishShape = this._finishShape.bind(this);
            if (this._markers[0] && this._markers[0]._icon) {
              this._markers[0]._icon.style.pointerEvents = 'auto';
              this._markers[0]._icon.style.cursor = 'pointer';
            }
          }
        }
        
        return result;
      };
      
      cleanups.push(() => {
        (L.Draw as any).Polygon.prototype._updateFinishHandler = originalUpdateFinishHandler;
      });
    }
    
    // Fix the _onMouseDown handler to ensure markers are created when clicking
    const originalOnMouseDown = (L.Draw as any).Polygon.prototype._onMouseDown;
    
    if (originalOnMouseDown) {
      (L.Draw as any).Polygon.prototype._onMouseDown = function(e: any) {
        // Prevent the default behavior to avoid creating markers instead of vertices
        if (e && e.originalEvent) {
          e.originalEvent._simulated = false;
        }
        
        // Call the original handler
        const result = originalOnMouseDown.call(this, e);
        
        // Force update the vertices
        if (this._poly && this._markers && this._markers.length > 0) {
          this._updateTooltip(e);
        }
        
        return result;
      };
      
      cleanups.push(() => {
        (L.Draw as any).Polygon.prototype._onMouseDown = originalOnMouseDown;
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
        this.options.shapeOptions.weight = 4;
        this.options.shapeOptions.opacity = 1;
      }
      
      // Ensure guide line is clearly visible
      if (this.options) {
        this.options.guidelineDistance = 10;
        this.options.shapeOptions = this.options.shapeOptions || {};
        this.options.guidelineOptions = {
          color: '#33C3F0',
          weight: 2,
          opacity: 1,
          dashArray: '5, 5'
        };
      }
    };
    
    cleanups.push(() => {
      (L.Draw as any).Polygon.prototype.initialize = originalInitialize;
    });
    
    // Fix the vertex connection issue by overriding _onMouseMove
    const originalOnMouseMove = (L.Draw as any).Polygon.prototype._onMouseMove;
    if (originalOnMouseMove) {
      (L.Draw as any).Polygon.prototype._onMouseMove = function(e: any) {
        const result = originalOnMouseMove.call(this, e);
        
        // Force update the guideline to make it visible
        if (this._poly) {
          const latlngs = this._poly.getLatLngs();
          if (latlngs.length > 0 && latlngs[0].length > 0) {
            // Make sure the guideline is visible
            if (this._guidesContainer) {
              this._guidesContainer.style.display = 'block';
              this._guidesContainer.style.opacity = '1';
            }
          }
        }
        
        return result;
      };
      
      cleanups.push(() => {
        (L.Draw as any).Polygon.prototype._onMouseMove = originalOnMouseMove;
      });
    }
  }
  
  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
};
