
import { useRef, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

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
      
      if (previousViewRef.current === 'cesium') {
        setTimeout(() => {
          setMapReady(true);
          
          // When 3D globe is ready after transition, notify user
          toast({
            title: "3D Globe Ready",
            description: "Interactive 3D globe view has been loaded.",
            variant: "default",
          });
        }, 500);
      }
    }
  };

  const handleLeafletMapRef = (map: any) => {
    // Only update if not already set or explicitly changing views
    if (!leafletMapRef.current || previousViewRef.current !== 'leaflet') {
      console.log('Setting Leaflet map reference');
      leafletMapRef.current = map;
      
      // When Leaflet map is ready after transition, notify user
      if (previousViewRef.current === 'leaflet' && !viewTransitionInProgress) {
        setTimeout(() => {
          setMapReady(true);
          
          toast({
            title: "Map View Ready",
            description: "Tiled map view has been loaded successfully.",
            variant: "default",
          });
        }, 500);
      }
    }
  };

  const handleMapReadyInternal = (onMapReady: () => void) => {
    setMapReady(true);
    onMapReady();
  };

  // Reset map instance when view changes
  const updateMapKeyOnViewChange = (currentView: string) => {
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
    mapKey,
    setMapKey,
    viewTransitionInProgress,
    mapReady,
    setMapReady,
    previousViewRef,
    handleCesiumViewerRef,
    handleLeafletMapRef,
    handleMapReadyInternal,
    updateMapKeyOnViewChange
  };
}
