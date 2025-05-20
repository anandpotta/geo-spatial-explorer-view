
import L from 'leaflet';

/**
 * Enhances polygon guidelines to make them more visible while drawing
 */
export const enhancePolygonGuidelines = (): () => void => {
  const cleanups: Array<() => void> = [];
  
  // Fix the vertex connection issue by overriding _onMouseMove
  if ((L.Draw as any).Polygon && (L.Draw as any).Polygon.prototype) {
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
