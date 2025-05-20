
import { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';

/**
 * Custom hook to manage map view transitions
 */
export function useMapViewTransition(currentView: 'cesium' | 'leaflet') {
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [viewTransitionInProgress, setViewTransitionInProgress] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const previousViewRef = useRef<string | null>(null);
  
  // Reset map instance when view changes
  useEffect(() => {
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
  }, [currentView]);

  // Notify user when map view is ready after transition
  const handleMapReady = (onMapReady: () => void) => {
    setMapReady(true);
    
    if (!viewTransitionInProgress) {
      if (currentView === 'cesium') {
        toast({
          title: "3D Globe Ready",
          description: "Interactive 3D globe view has been loaded.",
          variant: "default",
        });
      } else if (currentView === 'leaflet') {
        toast({
          title: "Map View Ready",
          description: "Tiled map view has been loaded successfully.",
          variant: "default",
        });
      }
    }
    
    onMapReady();
  };
  
  return {
    mapKey,
    viewTransitionInProgress,
    mapReady,
    handleMapReady
  };
}
