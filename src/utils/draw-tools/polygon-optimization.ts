
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
