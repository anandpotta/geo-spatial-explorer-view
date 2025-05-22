
import { useRef, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

export function useMapReferenceManager() {
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [viewTransitionInProgress, setViewTransitionInProgress] = useState(false);

  const handleCesiumViewerRef = (viewer: any) => {
    cesiumViewerRef.current = viewer;
  };

  const handleLeafletMapRef = (map: any) => {
    leafletMapRef.current = map;
    // When Leaflet map is ready after transition, notify user
    if (!viewTransitionInProgress) {
      toast({
        title: "Map View Ready",
        description: "Tiled map view has been loaded successfully.",
        variant: "default",
      });
    }
  };

  // Reset map instance when view changes
  const handleViewChange = () => {
    setMapKey(Date.now());
    
    // Set transition flag
    setViewTransitionInProgress(true);
    const timer = setTimeout(() => {
      setViewTransitionInProgress(false);
    }, 1000); // Allow time for transition to complete
    
    return () => clearTimeout(timer);
  };

  return {
    cesiumViewerRef,
    leafletMapRef,
    mapKey,
    viewTransitionInProgress,
    handleCesiumViewerRef,
    handleLeafletMapRef,
    handleViewChange
  };
}
