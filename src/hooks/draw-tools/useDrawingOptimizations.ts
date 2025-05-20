
import L from 'leaflet';
import { useEffect } from 'react';
import { 
  optimizePolygonDrawing,
  setupEditHandlers,
  configureDrawingTools,
  fixTypeIsNotDefinedError,
  extendGeometryUtil 
} from '@/utils/drawing-tools';

/**
 * Hook to apply various optimizations for drawing tools
 */
export function useDrawingOptimizations() {
  useEffect(() => {
    // Fix the "type is not defined" error in area calculations
    const cleanupTypePatching = fixTypeIsNotDefinedError();
    
    // Extend GeometryUtil with getCorners function
    const cleanupGeometryUtil = extendGeometryUtil();
    
    // Set up edit handlers if needed
    const cleanupEditHandlers = setupEditHandlers();
    
    // Configure additional drawing tools
    const cleanupDrawingTools = configureDrawingTools();
    
    // Optimize polygon drawing specifically
    const originalOnMarkerDrag = optimizePolygonDrawing();
    
    // Cleanup function
    return () => {
      cleanupTypePatching();
      cleanupGeometryUtil();
      cleanupEditHandlers();
      cleanupDrawingTools();
      
      // Restore original marker drag handler if it was modified
      if (originalOnMarkerDrag && L.Edit && (L.Edit as any).Poly) {
        (L.Edit as any).Poly.prototype._onMarkerDrag = originalOnMarkerDrag;
      }
    };
  }, []);
}
