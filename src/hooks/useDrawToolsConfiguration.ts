
import { useEffect } from 'react';
import L from 'leaflet';
import { configureSvgRenderer, optimizePolygonDrawing, enhancePathPreservation } from '@/utils/draw-tools-utils';

/**
 * Hook to configure drawing tools with optimized rendering
 */
export function useDrawToolsConfiguration(featureGroup: L.FeatureGroup) {
  useEffect(() => {
    try {
      // Apply SVG renderer enhancements to reduce flickering
      const cleanupSvgRenderer = configureSvgRenderer();
      
      // Apply polygon drawing optimization
      const originalOnMarkerDrag = optimizePolygonDrawing();
      
      // Enhance path preservation (if map is available)
      let cleanupPathPreservation: (() => void) | null = null;
      if (featureGroup && (featureGroup as any)._map) {
        cleanupPathPreservation = enhancePathPreservation((featureGroup as any)._map);
      }
      
      // Cleanup on unmount
      return () => {
        cleanupSvgRenderer();
        if (cleanupPathPreservation) {
          cleanupPathPreservation();
        }
        
        // Restore original onMarkerDrag if it was modified
        if (L.Edit && typeof L.Edit === 'object') {
          // Use type assertion to access the Poly property safely
          const EditPoly = (L.Edit as any).Poly;
          if (EditPoly && EditPoly.prototype && originalOnMarkerDrag) {
            EditPoly.prototype._onMarkerDrag = originalOnMarkerDrag;
          }
        }
      };
    } catch (err) {
      console.error('Error configuring drawing tools:', err);
      return () => {};
    }
  }, [featureGroup]);
}
