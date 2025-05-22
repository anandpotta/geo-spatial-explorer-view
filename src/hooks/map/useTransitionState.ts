
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Location } from '@/utils/geo-utils';

export function useTransitionState(
  currentView: 'cesium' | 'leaflet',
  selectedLocation?: Location
) {
  const [viewTransitionInProgress, setViewTransitionInProgress] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousViewRef = useRef<'cesium' | 'leaflet' | null>(null);
  const transitionCountRef = useRef(0);
  
  // Track view changes to apply special handling for globe -> leaflet transition
  useEffect(() => {
    const isGlobeToMapTransition = previousViewRef.current === 'cesium' && currentView === 'leaflet';
    
    if (isGlobeToMapTransition) {
      console.log('Detected transition from Globe to Leaflet map - applying special handling');
      // Special handling for Globe -> Leaflet transition
      setViewTransitionInProgress(true);
      transitionCountRef.current++;
      
      // Allow more time for transition when going from globe to map
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      // Use a longer timeout for globe -> map transitions
      transitionTimeoutRef.current = setTimeout(() => {
        console.log('Ending globe->map transition');
        setViewTransitionInProgress(false);
        transitionTimeoutRef.current = null;
      }, 1500); // Increased from 1200 for more reliable transitions
      
      // Add another delayed tile refresh trigger for map view
      const currentTransitionCount = transitionCountRef.current;
      
      // Multiple delayed triggers to ensure tiles load
      [800, 1500, 2200].forEach(delay => {
        setTimeout(() => {
          // Only proceed if this is still the most recent transition
          if (transitionCountRef.current === currentTransitionCount) {
            document.dispatchEvent(new CustomEvent('leaflet-refresh-needed'));
            console.log(`Dispatched leaflet-refresh-needed event (delay: ${delay}ms)`);
          }
        }, delay);
      });
    }
    
    // Update previous view reference
    previousViewRef.current = currentView;
    
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [currentView]);
  
  const startTransition = useCallback(() => {
    console.log('Starting view transition');
    setViewTransitionInProgress(true);
    transitionCountRef.current++;
    
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
      
      // For leaflet view, dispatch a refresh event
      if (currentView === 'leaflet') {
        document.dispatchEvent(new CustomEvent('leaflet-refresh-needed'));
        console.log('Dispatched leaflet-refresh-needed event after transition end');
      }
    }, 1000); // Increased from 800 for smoother transitions
  }, [currentView]);
  
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
