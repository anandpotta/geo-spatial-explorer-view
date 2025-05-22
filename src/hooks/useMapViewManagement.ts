
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Location } from '@/utils/geo-utils';

type MapView = 'cesium' | 'leaflet';

export function useMapViewManagement(
  selectedLocation: Location | undefined,
  flyCompleted: boolean,
  onViewChangeComplete?: () => void
) {
  const [currentView, setCurrentView] = useState<MapView>('cesium');
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [leafletRefreshTrigger, setLeafletRefreshTrigger] = useState<number>(0);
  const pendingViewChangeTimerRef = useRef<number | null>(null);
  const viewTransitionInProgressRef = useRef(false);
  const viewChangeInProgressRef = useRef(false);
  const preventRapidChangeTimerRef = useRef<number | null>(null);
  const lastSelectedLocationRef = useRef<Location | undefined>(undefined);
  const flyCompletedRef = useRef(flyCompleted);
  const previousFlyCompletedRef = useRef(flyCompleted);
  const autoSwitchToLeafletTimerRef = useRef<number | null>(null);
  const pendingSwapRef = useRef(false);
  
  // Debug log for state changes
  console.log(`MapViewManagement: flyCompleted=${flyCompleted}, currentView=${currentView}, transition=${viewTransitionInProgressRef.current}`);
  
  // Update the ref when flyCompleted changes
  useEffect(() => {
    const wasCompleted = previousFlyCompletedRef.current;
    previousFlyCompletedRef.current = flyCompleted;
    flyCompletedRef.current = flyCompleted;
    
    // Log when flyCompleted changes
    if (wasCompleted !== flyCompleted && flyCompleted) {
      console.log("MapViewManagement: Detected flyCompleted transition to true");
      
      // Flag a pending swap when flyCompleted becomes true
      pendingSwapRef.current = true;
    }
  }, [flyCompleted]);

  // Handle actual view change with state updates
  const changeView = (view: MapView) => {
    console.log(`MapViewManagement: Changing view to ${view}`);
    setCurrentView(view);
    viewChangeInProgressRef.current = true;
    
    // Create a timer to reset the view change flag
    if (preventRapidChangeTimerRef.current) {
      window.clearTimeout(preventRapidChangeTimerRef.current);
    }
    
    preventRapidChangeTimerRef.current = window.setTimeout(() => {
      viewChangeInProgressRef.current = false;
      preventRapidChangeTimerRef.current = null;
    }, 1000); // Reduced from 1500ms to 1000ms for faster responsiveness
  };

  // Public method to handle view change requests
  const handleViewChange = (view: MapView) => {
    // Don't change if it's already the current view
    if (view === currentView) {
      return;
    }
    
    // Prevent rapid view changes
    if (viewTransitionInProgressRef.current || viewChangeInProgressRef.current) {
      toast({
        title: "Please wait",
        description: "View transition already in progress",
        duration: 2000,
      });
      return;
    }
    
    // Don't allow switching to leaflet until fly is completed
    if (view === 'leaflet' && !flyCompletedRef.current && selectedLocation) {
      toast({
        title: "Please wait",
        description: "Wait for navigation to complete before switching views",
        duration: 2000,
      });
      return;
    }
    
    console.log(`MapViewManagement: Manually changing view to ${view}`);
    
    // Set transition flags
    viewTransitionInProgressRef.current = true;
    
    // Make the view change
    changeView(view);
    
    // Force map refresh when switching to leaflet with location
    if (view === 'leaflet' && selectedLocation) {
      setMapKey(Date.now());
      lastSelectedLocationRef.current = selectedLocation;
      
      // Log the location for debugging
      console.log(`MapViewManagement: Switching to leaflet view with location ${selectedLocation.label} at [${selectedLocation.y}, ${selectedLocation.x}]`);
      
      // Trigger leaflet refresh after a small delay to ensure it's fully mounted
      setTimeout(() => {
        setLeafletRefreshTrigger(prev => prev + 1);
        console.log("MapViewManagement: Triggering Leaflet refresh");
      }, 500); // Reduced from 700ms to 500ms
    }
    
    // Reset transition flags after a delay
    setTimeout(() => {
      viewTransitionInProgressRef.current = false;
      
      if (onViewChangeComplete) {
        onViewChangeComplete();
      }
    }, 1000); // Reduced from 1500ms to 1000ms
  };

  // Schedule switching to leaflet after cesium fly completes
  useEffect(() => {
    // Clear any existing auto-switch timer
    if (autoSwitchToLeafletTimerRef.current !== null) {
      window.clearTimeout(autoSwitchToLeafletTimerRef.current);
      autoSwitchToLeafletTimerRef.current = null;
    }
    
    // Only proceed with auto-switching if we have a pending swap
    // or if all required conditions are met
    if (
      (pendingSwapRef.current || 
       (currentView === 'cesium' && 
        selectedLocation && 
        flyCompleted && 
        !viewChangeInProgressRef.current &&
        !viewTransitionInProgressRef.current))
    ) {
      console.log(`MapViewManagement: Auto-switching to leaflet view after fly completion with location ${selectedLocation?.label}`);
      
      // Reset pending swap flag
      pendingSwapRef.current = false;
      
      // Set the view change flags to prevent rapid toggling
      viewChangeInProgressRef.current = true;
      viewTransitionInProgressRef.current = true;
      
      // Clear any existing pending view change
      if (pendingViewChangeTimerRef.current) {
        window.clearTimeout(pendingViewChangeTimerRef.current);
      }
      
      // Set a timeout to allow for state updates
      pendingViewChangeTimerRef.current = window.setTimeout(() => {
        console.log("MapViewManagement: Executing scheduled view change to leaflet");
        pendingViewChangeTimerRef.current = null;
        
        // Force map refresh to ensure proper positioning
        setMapKey(Date.now());
        lastSelectedLocationRef.current = selectedLocation;
        changeView('leaflet');
        
        // Add a small delay then trigger a Leaflet refresh
        autoSwitchToLeafletTimerRef.current = window.setTimeout(() => {
          console.log("MapViewManagement: Triggering Leaflet refresh after auto view change");
          setLeafletRefreshTrigger(prev => prev + 1);
          autoSwitchToLeafletTimerRef.current = null;
          
          // Reset the transition flag after transition completes
          window.setTimeout(() => {
            viewTransitionInProgressRef.current = false;
            
            // Reset the view change flag after a longer delay
            window.setTimeout(() => {
              viewChangeInProgressRef.current = false;
              
              // Force another refresh after all transitions complete
              setLeafletRefreshTrigger(prev => prev + 1);
              console.log("MapViewManagement: Forced additional refresh after transitions complete");
            }, 800); // Reduced from 1000ms to 800ms
          }, 400); // Reduced from 500ms to 400ms
        }, 500); // Reduced from 700ms to 500ms
      }, 400); // Reduced from 500ms to 400ms for more responsive UI
    }
  }, [currentView, selectedLocation, flyCompleted]);

  // Clear any pending timers on unmount
  useEffect(() => {
    return () => {
      if (pendingViewChangeTimerRef.current) {
        window.clearTimeout(pendingViewChangeTimerRef.current);
        pendingViewChangeTimerRef.current = null;
      }
      
      if (preventRapidChangeTimerRef.current) {
        window.clearTimeout(preventRapidChangeTimerRef.current);
        preventRapidChangeTimerRef.current = null;
      }
      
      if (autoSwitchToLeafletTimerRef.current) {
        window.clearTimeout(autoSwitchToLeafletTimerRef.current);
        autoSwitchToLeafletTimerRef.current = null;
      }
    };
  }, []);

  return {
    currentView,
    mapKey,
    leafletRefreshTrigger,
    viewChangeInProgressRef,
    handleViewChange,
    lastSelectedLocationRef
  };
}
