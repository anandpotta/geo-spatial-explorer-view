
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
  const [shouldKeepLocation, setShouldKeepLocation] = useState(true); // Default to true to preserve location
  const previousLocationRef = useRef<string | null>(null);
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [leafletRefreshTrigger, setLeafletRefreshTrigger] = useState<number>(0);

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
    setSelectedLocation(location);
    setFlyCompleted(false);
    
    // When selecting a location, remember to keep it during view switch
    setShouldKeepLocation(true);
    
    // Auto-switch to 3D globe view for better experience with new location
    if (currentView === 'leaflet') {
      console.log("Auto-switching to 3D view for better location experience");
      setCurrentView('cesium');
    }
  };

  const handleFlyComplete = () => {
    console.log("Main: Fly completed");
    setFlyCompleted(true);
    
    // After fly completes in cesium, switch to leaflet if needed
    if (currentView === 'cesium' && selectedLocation) {
      console.log("Switching to leaflet view after fly completion with location", selectedLocation.label);
      
      // Set a short timeout to allow for state updates
      setTimeout(() => {
        setCurrentView('leaflet');
        
        // Force map refresh to ensure proper positioning
        setMapKey(Date.now());
        
        // Add a small delay then trigger a Leaflet refresh
        setTimeout(() => {
          setLeafletRefreshTrigger(Date.now());
        }, 500);
      }, 800); // Use a delay for smoother transition
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
        setLeafletRefreshTrigger(Date.now());
      }, 300);
    }
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
    
    // Force map refresh when switching to leaflet with location
    if (view === 'leaflet' && selectedLocation) {
      setMapKey(Date.now());
      
      // Trigger leaflet refresh after a small delay
      setTimeout(() => {
        setLeafletRefreshTrigger(Date.now());
      }, 500);
    }
    
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
  
  // Always preserve the location when switching views
  useEffect(() => {
    if (selectedLocation) {
      console.log(`View changed to ${currentView}, preserving location ${selectedLocation.label}`);
      
      // If switching to leaflet, ensure the map refreshes
      if (currentView === 'leaflet') {
        setTimeout(() => {
          setLeafletRefreshTrigger(Date.now());
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
        key={`${mapKey}-${leafletRefreshTrigger}`} // Force recreation with both keys
      />
    </div>
  );
};

export default Index;
