
import { useState, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Location } from '@/utils/geo-utils';

export function useTransitionState(
  currentView: 'cesium' | 'leaflet',
  selectedLocation?: Location
) {
  const [viewTransitionInProgress, setViewTransitionInProgress] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const startTransition = useCallback(() => {
    console.log('Starting view transition');
    setViewTransitionInProgress(true);
    
    // Clear any existing transition timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
  }, []);
  
  const endTransition = useCallback(() => {
    // Use a timeout to ensure the transition has enough time to complete
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      console.log('Ending view transition');
      setViewTransitionInProgress(false);
      transitionTimeoutRef.current = null;
    }, 600);
  }, []);
  
  const showViewReadyToast = useCallback(() => {
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
  }, [currentView, selectedLocation, viewTransitionInProgress]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  return {
    viewTransitionInProgress,
    startTransition,
    endTransition,
    showViewReadyToast,
    cleanup
  };
}
