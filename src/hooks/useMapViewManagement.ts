
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

  // Handle actual view change with state updates
  const changeView = (view: MapView) => {
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
    if (view === 'leaflet' && !flyCompleted && selectedLocation) {
      toast({
        title: "Please wait",
        description: "Wait for navigation to complete before switching views",
        duration: 2000,
      });
      return;
    }
    
    console.log(`Changing view to ${view}`);
    
    // Set transition flags
    viewTransitionInProgressRef.current = true;
    
    // Make the view change
    changeView(view);
    
    // Force map refresh when switching to leaflet with location
    if (view === 'leaflet' && selectedLocation) {
      setMapKey(Date.now());
      lastSelectedLocationRef.current = selectedLocation;
      
      // Trigger leaflet refresh after a small delay
      setTimeout(() => {
        setLeafletRefreshTrigger(prev => prev + 1);
      }, 700);
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
    if (currentView === 'cesium' && selectedLocation && flyCompleted && !viewChangeInProgressRef.current) {
      console.log("Scheduling switch to leaflet view after fly completion with location", selectedLocation.label);
      
      // Set the view change flag to prevent rapid toggling
      viewChangeInProgressRef.current = true;
      
      // Clear any existing pending view change
      if (pendingViewChangeTimerRef.current) {
        window.clearTimeout(pendingViewChangeTimerRef.current);
      }
      
      // Set a short timeout to allow for state updates
      pendingViewChangeTimerRef.current = window.setTimeout(() => {
        console.log("Executing scheduled view change to leaflet");
        pendingViewChangeTimerRef.current = null;
        
        // Force map refresh to ensure proper positioning
        setMapKey(Date.now());
        lastSelectedLocationRef.current = selectedLocation;
        changeView('leaflet');
        
        // Add a small delay then trigger a Leaflet refresh
        window.setTimeout(() => {
          setLeafletRefreshTrigger(prev => prev + 1);
          
          // Reset the view change flag after transition completes
          window.setTimeout(() => {
            viewChangeInProgressRef.current = false;
          }, 1000);
        }, 700);
      }, 1200); // Use a longer delay for smoother transition
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
