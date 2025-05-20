
import L from 'leaflet';
import { useEffect } from 'react';
import { enhancePathPreservation, makeFeatureGroupGlobal } from '@/utils/drawing-tools';

/**
 * Hook to configure path tracking and preservation
 */
export function useDrawingPathTracking(map: L.Map | null, featureGroup: L.FeatureGroup | null) {
  useEffect(() => {
    if (!map || !featureGroup) return;
    
    // Set up path preservation
    const cleanupPathPreservation = enhancePathPreservation(map);
    
    // Make feature group globally available for edit operations
    const cleanupFeatureGroup = makeFeatureGroupGlobal(featureGroup);
    
    return () => {
      cleanupPathPreservation();
      cleanupFeatureGroup();
    };
  }, [map, featureGroup]);
}
