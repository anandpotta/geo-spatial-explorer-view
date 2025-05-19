
import { useRef, useState, useEffect } from 'react';

export function useMapRefs() {
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [viewTransitionInProgress, setViewTransitionInProgress] = useState(false);
  const previousViewRef = useRef<string | null>(null);
  const [mapKey, setMapKey] = useState<number>(Date.now());

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

  const handleMapReady = () => {
    setMapReady(true);
  };

  // Manage view transitions
  const handleViewTransition = (currentView: string) => {
    // Only regenerate key when view type actually changes
    if (previousViewRef.current !== currentView) {
      console.log(`View changed from ${previousViewRef.current} to ${currentView}, regenerating map key`);
      setMapKey(Date.now());
      previousViewRef.current = currentView;
      
      // Set transition flag
      setViewTransitionInProgress(true);
      const timer = setTimeout(() => {
        setViewTransitionInProgress(false);
        setMapReady(false);
      }, 1000); // Allow time for transition to complete
      
      return () => clearTimeout(timer);
    }
  };

  return {
    cesiumViewerRef,
    leafletMapRef,
    mapReady,
    setMapReady,
    viewTransitionInProgress,
    mapKey,
    previousViewRef,
    handleCesiumViewerRef,
    handleLeafletMapRef,
    handleMapReady,
    handleViewTransition
  };
}
