
import L from 'leaflet';

/**
 * Patches Leaflet Draw Polygon functionality to fix common issues
 */
export function applyPolygonDrawPatches(): void {
  if (!L.Draw || !L.Draw.Polygon || !L.Draw.Polygon.prototype) return;
  
  // Patch the readableArea function to ensure 'type' is defined
  const originalReadableArea = (L.Draw.Polygon.prototype as any)._getTooltipText;
  if (originalReadableArea) {
    (L.Draw.Polygon.prototype as any)._getTooltipText = function() {
      try {
        return originalReadableArea.apply(this);
      } catch (err) {
        // If the error is about 'type', provide a default text
        if (err.toString().includes('type is not defined')) {
          const result: any = {};
          result.text = this._endLabelText || 'Click first point to close this shape';
          result.subtext = this._getMeasurementString ? this._getMeasurementString() : 'Calculate area after completion';
          return result;
        }
        throw err;
      }
    };
  }
  
  // Ensure markers and guides are visible during polygon drawing
  if ((L.Draw.Polygon.prototype as any)._createMarker) {
    const originalCreateMarker = (L.Draw.Polygon.prototype as any)._createMarker;
    (L.Draw.Polygon.prototype as any)._createMarker = function(latlng: L.LatLng, index: number) {
      const marker = originalCreateMarker.call(this, latlng, index);
      if (marker && marker._icon) {
        marker._icon.style.visibility = 'visible';
        marker._icon.style.opacity = '1';
        marker._icon.style.zIndex = '10000';
        marker._icon.style.pointerEvents = 'auto';
      }
      return marker;
    };
  }
  
  // Ensure that vertices are visible during drawing
  if ((L.Draw.Polygon.prototype as any)._updateGuide) {
    const originalUpdateGuide = (L.Draw.Polygon.prototype as any)._updateGuide;
    (L.Draw.Polygon.prototype as any)._updateGuide = function(latlng: L.LatLng) {
      originalUpdateGuide.call(this, latlng);
      
      // Ensure all markers in the vertex list are visible
      if (this._markers && this._markers.length) {
        this._markers.forEach((marker: any) => {
          if (marker._icon) {
            marker._icon.style.visibility = 'visible';
            marker._icon.style.opacity = '1';
            marker._icon.style.zIndex = '10000';
            marker._icon.style.pointerEvents = 'auto';
          }
        });
      }
    };
  }
}

/**
 * Global initialization for Polygon patch
 */
export function initGlobalPolygonPatch(): void {
  if (typeof window !== 'undefined' && window.L && window.L.Draw) {
    try {
      // Create a global patch that will affect all instances
      const originalDraw = window.L.Draw;
      
      // If Leaflet Draw is loaded, patch the prototype
      if (originalDraw.Polygon) {
        const originalReadableArea = (originalDraw.Polygon.prototype as any)._getTooltipText;
        
        if (originalReadableArea) {
          (originalDraw.Polygon.prototype as any)._getTooltipText = function() {
            try {
              return originalReadableArea.apply(this);
            } catch (err) {
              // If error is about 'type is not defined', provide fallback
              console.log("Caught error in _getTooltipText:", err.message);
              const result: any = {};
              result.text = this._endLabelText || 'Click first point to close this shape';
              // Safely call _getMeasurementString with a type property defined
              try {
                result.subtext = this._getMeasurementString ? this._getMeasurementString() : "Calculate area after completion";
              } catch (measureErr) {
                result.subtext = "Calculate area after completion";
              }
              return result;
            }
          };
        }

        // Ensure that vertices are visible during drawing
        if ((originalDraw.Polygon.prototype as any)._updateGuide) {
          const originalUpdateGuide = (originalDraw.Polygon.prototype as any)._updateGuide;
          (originalDraw.Polygon.prototype as any)._updateGuide = function(latlng: L.LatLng) {
            originalUpdateGuide.call(this, latlng);
            
            // Ensure all markers in the vertex list are visible
            if (this._markers && this._markers.length) {
              this._markers.forEach((marker: any) => {
                if (marker._icon) {
                  marker._icon.style.visibility = 'visible';
                  marker._icon.style.opacity = '1';
                  marker._icon.style.zIndex = '10000';
                  marker._icon.style.pointerEvents = 'auto';
                }
              });
            }
          };
        }
      }
    } catch (err) {
      console.error("Error patching Leaflet Draw:", err);
    }
  }
}
