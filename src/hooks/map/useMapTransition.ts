
import { useEffect, useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMapKey } from './useMapKey';
import { useTransitionState } from './useTransitionState';
import { useViewChangeTracker } from './useViewChangeTracker';
import { toast } from '@/components/ui/use-toast';

export function useMapTransition(
  currentView: 'cesium' | 'leaflet',
  selectedLocation?: Location,
  onMapReady?: () => void
) {
  const { mapKey, mapReady, setMapReady, regenerateMapKey } = useMapKey();
  
  // Using refs instead of state from useTransitionState to avoid React queue errors
  const viewTransitionInProgressRef = useRef(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const startTransition = () => {
    viewTransitionInProgressRef.current = true;
  };
  
  const endTransition = () => {
    viewTransitionInProgressRef.current = false;
  };
  
  const showViewReadyToast = () => {
    if (!viewTransitionInProgressRef.current) {
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
  
  // Track view changes and regenerate map key when necessary
  useEffect(() => {
    // Create a ref to track previous view inside the effect
    const prevViewRef = useRef<string | null>(null);
    
    const handleViewChange = (prevView: string | null) => {
      if (prevView !== currentView) {
        console.log(`View changed from ${prevView} to ${currentView}, handling transition`);
        regenerateMapKey();
        startTransition();
        
        // Clear any existing transition timer
        if (transitionTimerRef.current) {
          clearTimeout(transitionTimerRef.current);
        }
        
        // Set a timer to end the transition
        transitionTimerRef.current = setTimeout(() => {
          endTransition();
          setMapReady(false);
          transitionTimerRef.current = null;
        }, 1000);
      }
    };
    
    // Handle view change
    if (prevViewRef.current !== currentView) {
      handleViewChange(prevViewRef.current);
      prevViewRef.current = currentView;
    }
    
    // Cleanup function
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [currentView, regenerateMapKey]);

  const handleMapReadyInternal = () => {
    setMapReady(true);
    
    if (onMapReady) {
      onMapReady();
    }
    
    // Display appropriate toast message based on the view
    showViewReadyToast();
  };

  return {
    mapKey,
    viewTransitionInProgress: viewTransitionInProgressRef.current,
    mapReady,
    setMapReady,
    handleMapReadyInternal
  };
}
