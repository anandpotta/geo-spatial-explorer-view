
import L from 'leaflet';

/**
 * Configures polygon-specific handlers for improving drawing experience
 */
export const configurePolygonHandlers = (): () => void => {
  const cleanups: Array<() => void> = [];
  
  // Fix _updateFinishHandler to ensure finish button works correctly
  if ((L.Draw as any).Polygon && (L.Draw as any).Polygon.prototype) {
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
  
  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
};
