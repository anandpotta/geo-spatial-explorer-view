
import { useRef } from 'react';

export function useMapRefs() {
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  
  const handleCesiumViewerRef = (viewer: any) => {
    cesiumViewerRef.current = viewer;
  };

  const handleLeafletMapRef = (map: any) => {
    leafletMapRef.current = map;
  };

  return {
    cesiumViewerRef,
    leafletMapRef,
    handleCesiumViewerRef,
    handleLeafletMapRef
  };
}
