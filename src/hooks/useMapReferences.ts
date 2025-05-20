
import { useRef, MutableRefObject } from 'react';
import { LeafletMapInternal } from '@/utils/leaflet-type-utils';

/**
 * Custom hook to manage map references
 */
export function useMapReferences() {
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<LeafletMapInternal>(null);

  const handleCesiumViewerRef = (viewer: any) => {
    // Only update if not already set or explicitly changing views
    if (!cesiumViewerRef.current) {
      console.log('Setting Cesium viewer reference');
      cesiumViewerRef.current = viewer;
    }
  };

  const handleLeafletMapRef = (map: any) => {
    // Only update if not already set or explicitly changing views
    if (!leafletMapRef.current) {
      console.log('Setting Leaflet map reference');
      leafletMapRef.current = map;
    }
  };

  return {
    cesiumViewerRef,
    leafletMapRef,
    handleCesiumViewerRef,
    handleLeafletMapRef
  };
}
