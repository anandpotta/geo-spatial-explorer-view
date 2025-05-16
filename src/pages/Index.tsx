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
  const [shouldSwitchToLeaflet, setShouldSwitchToLeaflet] = useState(false);
  const previousLocationRef = useRef<string | null>(null);
  const [viewTransitionReady, setViewTransitionReady] = useState(true);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leafletReadyRef = useRef(false);

  const handleLocationSelect = (location: Location) => {
    // Prevent multiple rapid location selections
    const now = Date.now();
    if (locationSelectionTimeRef.current && 
        now - locationSelectionTimeRef.current < 800) { // Slightly faster prevention
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
    console.log("Main: Location selected:", location.label);
    setSelectedLocation(location);
    setFlyCompleted(false);
    
    // Always start in 3D view when selecting a new location
    if (currentView === 'leaflet') {
      console.log("Switching to 3D view for location transition");
      setCurrentView('cesium');
    }
    
    // Plan to switch to leaflet after fly completes
    setShouldSwitchToLeaflet(true);
    
    // Mark transition as in progress to prevent UI flashing
    setViewTransitionReady(false);
    
    // Safety timeout - if fly completion doesn't trigger within 8 seconds,
    // force transition to continue
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      if (!flyCompleted) {
        console.log("Fly completion timeout - forcing completion");
        handleFlyComplete();
      }
    }, 8000);
  };

  const handleFlyComplete = () => {
    console.log("Main: Fly completed");
    setFlyCompleted(true);
    
    // Clear any pending timeouts
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    
    // If we should switch to leaflet after fly completes, prepare for transition
    if (shouldSwitchToLeaflet && currentView === 'cesium') {
      console.log("Preparing transition to leaflet view after fly completion");
      
      // Start transition to leaflet immediately but keep transition state
      // to ensure smooth visual transition
      setCurrentView('leaflet');
      setShouldSwitchToLeaflet(false);
      
      // Slight delay before showing toast for better UX
      setTimeout(() => {
        // Show toast with location info
        if (selectedLocation) {
          toast({
            title: "Navigation Complete",
            description: `Now showing ${selectedLocation.label}`,
            duration: 3000,
          });
        }
        
        // Reset view transition ready state slightly later
        setTimeout(() => {
          setViewTransitionReady(true);
        }, 300);
      }, 500);
    } else {
      // If not switching views, just reset transition state
      setViewTransitionReady(true);
    }
    
    // Reset location selection timer
    locationSelectionTimeRef.current = null;
  };

  const handleMapReady = () => {
    console.log('Map is ready');
    
    // If this is the leaflet map becoming ready, mark it
    if (currentView === 'leaflet') {
      leafletReadyRef.current = true;
    }
    
    // Allow a small delay for map rendering before marking ready
    setTimeout(() => {
      setViewTransitionReady(true);
    }, 200);
  };

  const handleViewChange = (view: 'cesium' | 'leaflet') => {
    // Prevent rapid view changes
    if (viewTransitionInProgressRef.current) {
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
    setViewTransitionReady(false); // Start transition
    setCurrentView(view);
    setShouldSwitchToLeaflet(false); // Reset switch flag when manually changing view
    
    // Set transition flag
    viewTransitionInProgressRef.current = true;
    setTimeout(() => {
      viewTransitionInProgressRef.current = false;
      setViewTransitionReady(true); // End transition
    }, 800); // Slightly faster transition
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

  // Manage view transition effects
  useEffect(() => {
    if (!viewTransitionReady) {
      // If transition is happening, set a backup timer to ensure we don't get stuck
      const timer = setTimeout(() => {
        setViewTransitionReady(true);
      }, 2000); // Shorter timeout
      return () => clearTimeout(timer);
    }
  }, [viewTransitionReady]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

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
        viewTransitionReady={viewTransitionReady}
      />
    </div>
  );
};

export default Index;
