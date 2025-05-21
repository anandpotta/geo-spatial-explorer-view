
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
    
    // Auto-switch to 3D globe view for better experience with new location
    if (currentView === 'leaflet') {
      console.log("Auto-switching to 3D view for better location experience");
      setCurrentView('cesium');
    } else {
      // If already in cesium view, mark that we should switch to leaflet after fly completes
      setShouldSwitchToLeaflet(true);
    }
  };

  const handleFlyComplete = () => {
    console.log("Main: Fly completed");
    setFlyCompleted(true);
    
    // If we should switch to leaflet after fly completes, do it now
    if (shouldSwitchToLeaflet && currentView === 'cesium') {
      console.log("Switching to leaflet view after fly completion");
      setTimeout(() => {
        setCurrentView('leaflet');
        setShouldSwitchToLeaflet(false);
      }, 1000); // Use a longer delay for smoother transition
    }
    
    // Reset location selection timer
    setTimeout(() => {
      locationSelectionTimeRef.current = null;
    }, 500);
  };

  const handleMapReady = () => {
    console.log('Map is ready');
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
    setCurrentView(view);
    setShouldSwitchToLeaflet(false); // Reset switch flag when manually changing view
    
    // Set transition flag
    viewTransitionInProgressRef.current = true;
    setTimeout(() => {
      viewTransitionInProgressRef.current = false;
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
      />
    </div>
  );
};

export default Index;
