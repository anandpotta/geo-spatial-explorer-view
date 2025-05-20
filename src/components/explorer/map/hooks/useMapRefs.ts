
import { useRef, useState } from 'react';

export function useMapRefs() {
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [viewTransitionInProgress, setViewTransitionInProgress] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const previousViewRef = useRef<string | null>(null);

  const handleCesiumViewerRef = (viewer: any) => {
    // Only update if not already set or explicitly changing views
    if (!cesiumViewerRef.current || previousViewRef.current !== 'cesium') {
      console.log('Setting Cesium viewer reference');
      cesiumViewerRef.current = viewer;
    }
  };

  const handleLeafletMapRef = (map: any) => {
    // Only update if not already set or explicitly changing views
    if (!leafletMapRef.current || previousViewRef.current !== 'leaflet') {
      console.log('Setting Leaflet map reference');
      leafletMapRef.current = map;
    }
  };

  return {
    cesiumViewerRef,
    leafletMapRef,
    mapKey,
    setMapKey,
    viewTransitionInProgress,
    setViewTransitionInProgress,
    mapReady,
    setMapReady,
    previousViewRef,
    handleCesiumViewerRef,
    handleLeafletMapRef
  };
}
