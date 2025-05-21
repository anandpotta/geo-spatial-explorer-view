import { useState, useRef, useEffect } from 'react';
import MapContent from '@/components/explorer/MapContent';
import ExplorerSidebar from '@/components/explorer/ExplorerSidebar';
import { Location } from '@/utils/geo-utils';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [currentView, setCurrentView] = useState<'cesium' | 'leaflet'>('cesium');
  const [flyCompleted, setFlyCompleted] = useState<boolean>(true);
  const viewTransitionInProgressRef = useRef(false);
  const locationSelectionTimeRef = useRef<number | null>(null);
  const [shouldKeepLocation, setShouldKeepLocation] = useState(true);
  const previousLocationRef = useRef<string | null>(null);
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [leafletRefreshTrigger, setLeafletRefreshTrigger] = useState<number>(0);
  const pendingViewChangeTimerRef = useRef<number | null>(null);
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const viewChangeInProgressRef = useRef(false);
  const preventRapidChangeTimerRef = useRef<number | null>(null);

  const handleLocationSelect = (location: Location) => {
    // Prevent multiple rapid location selections
    const now = Date.now();
    if (locationSelectionTimeRef.current && 
        now - locationSelectionTimeRef.current < 1000) {
      return;
    }
    
    // Skip if selecting the same location
    const locationId = location.id;
    if (previousLocationRef.current === locationId) {
      console.log("Skipping duplicate location selection");
      return;
    }
    previousLocationRef.current = locationId;
    
    locationSelectionTimeRef.current = now;
    console.log("Main: Location selected:", location.label, "at coordinates:", location.y, location.x);
    
    // Stop any pending view changes
    if (pendingViewChangeTimerRef.current) {
      window.clearTimeout(pendingViewChangeTimerRef.current);
      pendingViewChangeTimerRef.current = null;
    }
    
    setSelectedLocation(location);
    setFlyCompleted(false);
    
    // When selecting a location, remember to keep it during view switch
    setShouldKeepLocation(true);
    
    // Auto-switch to 3D globe view for better experience with new location
    if (currentView === 'leaflet') {
      console.log("Auto-switching to 3D view for better location experience");
      setCurrentView('cesium');
      viewChangeInProgressRef.current = true;
      
      // Create a timer to reset the view change flag
      if (preventRapidChangeTimerRef.current) {
        window.clearTimeout(preventRapidChangeTimerRef.current);
      }
      
      preventRapidChangeTimerRef.current = window.setTimeout(() => {
        viewChangeInProgressRef.current = false;
        preventRapidChangeTimerRef.current = null;
      }, 1500);
    }
  };

  const handleFlyComplete = () => {
    console.log("Main: Fly completed");
    setFlyCompleted(true);
    
    // After fly completes in cesium, switch to leaflet if needed
    if (currentView === 'cesium' && selectedLocation && !viewChangeInProgressRef.current) {
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
        setCurrentView('leaflet');
        
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
    
    // Reset location selection timer
    setTimeout(() => {
      locationSelectionTimeRef.current = null;
    }, 500);
  };

  const handleMapReady = () => {
    console.log('Map is ready');
    
    // If we have a location and we're in leaflet view, trigger a refresh
    if (selectedLocation && currentView === 'leaflet') {
      setTimeout(() => {
        setLeafletRefreshTrigger(prev => prev + 1);
      }, 300);
    }
  };

  const handleViewChange = (view: 'cesium' | 'leaflet') => {
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
    viewChangeInProgressRef.current = true;
    
    // Make the view change
    setCurrentView(view);
    
    // Force map refresh when switching to leaflet with location
    if (view === 'leaflet' && selectedLocation) {
      setMapKey(Date.now());
      
      // Trigger leaflet refresh after a small delay
      setTimeout(() => {
        setLeafletRefreshTrigger(prev => prev + 1);
      }, 700);
    }
    
    // Reset transition flags after a delay
    setTimeout(() => {
      viewTransitionInProgressRef.current = false;
      
      // Add a longer delay before allowing another transition
      setTimeout(() => {
        viewChangeInProgressRef.current = false;
      }, 1000);
    }, 1500);
  };

  const handleSavedLocationSelect = (position: [number, number]) => {
    // Convert position to Location
    const newLocation: Location = {
      id: `saved-${Date.now()}`,
      label: 'Saved Location',
      x: position[1], // longitude is the second value
      y: position[0]  // latitude is the first value
    };
    handleLocationSelect(newLocation);
  };
  
  const handleCesiumViewerRef = (viewer: any) => {
    cesiumViewerRef.current = viewer;
  };
  
  const handleLeafletMapRef = (map: any) => {
    leafletMapRef.current = map;
  };
  
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
  
  // Always preserve the location when switching views
  useEffect(() => {
    if (selectedLocation) {
      console.log(`View changed to ${currentView}, preserving location ${selectedLocation.label}`);
      
      // If switching to leaflet, ensure the map refreshes
      if (currentView === 'leaflet') {
        setTimeout(() => {
          setLeafletRefreshTrigger(prev => prev + 1);
        }, 300);
      }
    }
  }, [currentView, selectedLocation]);

  return (
    <div className="h-screen flex">
      <ExplorerSidebar 
        selectedLocation={selectedLocation}
        currentView={currentView}
        flyCompleted={flyCompleted}
        setCurrentView={handleViewChange}
        onSavedLocationSelect={handleSavedLocationSelect}
      />
      <MapContent 
        currentView={currentView}
        selectedLocation={selectedLocation}
        onMapReady={handleMapReady}
        onFlyComplete={handleFlyComplete}
        onLocationSelect={handleLocationSelect}
        handleCesiumViewerRef={handleCesiumViewerRef}
        handleLeafletMapRef={handleLeafletMapRef}
        key={`${mapKey}-${currentView}-${leafletRefreshTrigger}`} // Force recreation with current view and refresh trigger
      />
    </div>
  );
};

export default Index;
