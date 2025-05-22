
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
  const leafletRefreshAttempts = useRef(0);
  const maxRefreshAttempts = 3;
  
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
      
      // If we're in Cesium view with a selected location and fly is completed,
      // this is a good time to prepare for the view switch
      if (currentView === 'cesium' && selectedLocation) {
        console.log("MapViewManagement: Preparing for auto-switch to leaflet");
        // Store the location for later use
        lastSelectedLocationRef.current = selectedLocation;
      }
    }
  }, [flyCompleted, selectedLocation, currentView]);

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
    }, 1500);
    
    // Generate a new map key to force components to reinitialize
    setMapKey(Date.now());
    
    // Trigger a global event to notify components of the view change
    window.dispatchEvent(new CustomEvent('mapViewChange', { detail: { view } }));
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
      lastSelectedLocationRef.current = selectedLocation;
      leafletRefreshAttempts.current = 0;
      
      // Log the location for debugging
      console.log(`MapViewManagement: Switching to leaflet view with location ${selectedLocation.label} at [${selectedLocation.y}, ${selectedLocation.x}]`);
      
      // Schedule multiple refresh attempts to ensure proper map initialization
      const scheduleRefresh = (delay: number) => {
        setTimeout(() => {
          if (leafletRefreshAttempts.current < maxRefreshAttempts) {
            leafletRefreshAttempts.current++;
            setLeafletRefreshTrigger(prev => prev + 1);
            console.log(`MapViewManagement: Triggering Leaflet refresh attempt ${leafletRefreshAttempts.current}`);
          }
        }, delay);
      };
      
      // Schedule multiple refresh attempts with increasing delays
      scheduleRefresh(300); // First attempt
      scheduleRefresh(800); // Second attempt
      scheduleRefresh(1500); // Final attempt
    }
    
    // Reset transition flags after a delay
    setTimeout(() => {
      viewTransitionInProgressRef.current = false;
      
      if (onViewChangeComplete) {
        onViewChangeComplete();
      }
    }, 1500);
  };

  // Schedule switching to leaflet after cesium fly completes
  useEffect(() => {
    // Only proceed if all required conditions are met
    if (
      currentView === 'cesium' && 
      selectedLocation && 
      flyCompleted && 
      !viewChangeInProgressRef.current &&
      !viewTransitionInProgressRef.current
    ) {
      console.log(`MapViewManagement: Auto-switching to leaflet view after fly completion with location ${selectedLocation.label}`);
      
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
        
        // Reset the refresh attempt counter
        leafletRefreshAttempts.current = 0;
        
        // Schedule multiple refresh attempts to ensure proper map initialization
        const scheduleRefresh = (delay: number) => {
          setTimeout(() => {
            if (leafletRefreshAttempts.current < maxRefreshAttempts) {
              leafletRefreshAttempts.current++;
              setLeafletRefreshTrigger(prev => prev + 1);
              console.log(`MapViewManagement: Auto-view change - Leaflet refresh attempt ${leafletRefreshAttempts.current}`);
            }
          }, delay);
        };
        
        scheduleRefresh(300); // First attempt
        scheduleRefresh(800); // Second attempt
        scheduleRefresh(1500); // Final attempt
        
        // Reset the transition flag after transition completes
        setTimeout(() => {
          viewTransitionInProgressRef.current = false;
          
          // Reset the view change flag after a longer delay
          setTimeout(() => {
            viewChangeInProgressRef.current = false;
          }, 1000);
        }, 500);
      }, 400); // Slightly shorter delay for more responsive UI
    }
  }, [currentView, selectedLocation, flyCompleted, onViewChangeComplete]);

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
