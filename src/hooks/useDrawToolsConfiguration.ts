
import { useEffect } from 'react';
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
        if (L.Edit && (L.Edit as any).Poly && (L.Edit as any).Poly.prototype && originalOnMarkerDrag) {
          (L.Edit as any).Poly.prototype._onMarkerDrag = originalOnMarkerDrag;
        }
      };
    } catch (err) {
      console.error('Error configuring drawing tools:', err);
      return () => {};
    }
  }, [featureGroup]);
}
