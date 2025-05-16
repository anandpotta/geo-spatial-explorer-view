
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
    
    // Safety timeout - if fly completion doesn't trigger within 10 seconds,
    // force transition to continue
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      if (!flyCompleted) {
        console.log("Fly completion timeout - forcing completion");
        handleFlyComplete();
      }
    }, 10000);
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
      
      // Short delay before switching to ensure globe has stabilized
      setTimeout(() => {
        setCurrentView('leaflet');
        setShouldSwitchToLeaflet(false);
        
        // Show toast with location info
        if (selectedLocation) {
          toast({
            title: "Navigation Complete",
            description: `Now showing ${selectedLocation.label}`,
            duration: 3000,
          });
        }
      }, 800); // Slightly longer delay for more stable transition
    }
    
    // Reset location selection timer
    setTimeout(() => {
      locationSelectionTimeRef.current = null;
      setViewTransitionReady(true);
    }, 500);
  };

  const handleMapReady = () => {
    console.log('Map is ready');
    setViewTransitionReady(true);
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
    }, 1000);
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
      }, 2500);
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
