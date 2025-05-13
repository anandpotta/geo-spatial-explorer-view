
import { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Location } from '@/utils/geo-utils';

export function useMapTransition(
  currentView: 'cesium' | 'leaflet',
  selectedLocation?: Location,
  onMapReady?: () => void
) {
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
      }, 800); // Slightly shorter for smoother transition
      
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  const handleMapReadyInternal = () => {
    setMapReady(true);
    
    if (onMapReady) {
      onMapReady();
    }
    
    // Display appropriate toast message based on the view
    if (!viewTransitionInProgress) {
      if (currentView === 'cesium') {
        toast({
          title: "3D Globe Ready",
          description: "Interactive 3D globe view has been loaded.",
          variant: "default",
          duration: 2000,
        });
      } else if (currentView === 'leaflet') {
        if (selectedLocation) {
          toast({
            title: "Map View Ready",
            description: `Showing ${selectedLocation.label}`,
            variant: "default",
            duration: 2000,
          });
        } else {
          toast({
            title: "Map View Ready",
            variant: "default",
            duration: 1500,
          });
        }
      }
    }
  };

  return {
    mapKey,
    viewTransitionInProgress,
    mapReady,
    setMapReady,
    handleMapReadyInternal
  };
}
