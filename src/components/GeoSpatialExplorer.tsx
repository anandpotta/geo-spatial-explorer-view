
import { useState, useEffect, useCallback } from 'react';
import { Location } from '@/utils/geo-utils';
import { useToast } from '@/components/ui/use-toast';
import ExplorerSidebar from './explorer/ExplorerSidebar';
import MapContent from './explorer/MapContent';
import SyncStatusIndicator from './SyncStatusIndicator';
import { useAuth } from '@/contexts/AuthContext';

const GeoSpatialExplorer = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [currentView, setCurrentView] = useState<'cesium' | 'leaflet'>('cesium'); // Always start with cesium
  const [isMapReady, setIsMapReady] = useState(false);
  const [flyCompleted, setFlyCompleted] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // Effect to handle initial map load
  useEffect(() => {
    if (isMapReady) {
      console.log('Map is ready for interactions');
    }
  }, [isMapReady]);
  
  // Effect to welcome the user
  useEffect(() => {
    if (currentUser) {
      toast({
        title: `Welcome ${currentUser.username}!`,
        description: 'Your personalized GeoSpatial Explorer is ready.',
        duration: 5000,
      });
    }
  }, [currentUser, toast]);
  
  const handleLocationSelect = useCallback((location: Location) => {
    console.log('Location selected in Explorer:', location);
    
    // Always force cesium view when selecting a new location
    setCurrentView('cesium');
    setFlyCompleted(false);
    
    // Set the selected location after a small delay to ensure view has changed
    setTimeout(() => {
      setSelectedLocation(location);
      
      toast({
        title: 'Location selected',
        description: `Navigating to ${location.label}`,
        duration: 3000,
      });
    }, 100);
  }, [toast]);
  
  const handleFlyComplete = useCallback(() => {
    console.log('Fly complete in Explorer, switching to leaflet view');
    setFlyCompleted(true);
    
    // Short delay before switching to leaflet view for a smoother transition
    setTimeout(() => {
      setCurrentView('leaflet');
      toast({
        title: 'Navigation complete',
        description: 'You can now draw building boundaries on the map',
        duration: 5000,
      });
    }, 500);
  }, [toast]);
  
  const handleSavedLocationSelect = useCallback((position: [number, number]) => {
    console.log('Saved location selected in Explorer with coordinates:', position);
    
    // Create a proper location object from coordinates
    const location: Location = {
      id: `saved-loc-${position[0]}-${position[1]}-${Date.now()}`,
      label: `Saved Location`,
      y: position[0], // latitude
      x: position[1]  // longitude
    };
    
    console.log('Created location object for navigation:', location);
    
    // Use the same flow as regular location selection
    handleLocationSelect(location);
  }, [handleLocationSelect]);
  
  // Expose the saved location handler globally for the dropdown to use
  useEffect(() => {
    console.log('Setting up global handleSavedLocationSelect');
    window.handleSavedLocationSelect = handleSavedLocationSelect;
    
    return () => {
      console.log('Cleaning up global handleSavedLocationSelect');
      delete window.handleSavedLocationSelect;
    };
  }, [handleSavedLocationSelect]);
  
  return (
    <div className="w-full h-full flex bg-black overflow-hidden">
      {/* Left Panel */}
      <ExplorerSidebar 
        selectedLocation={selectedLocation}
        currentView={currentView}
        flyCompleted={flyCompleted}
        setCurrentView={setCurrentView}
        onSavedLocationSelect={handleSavedLocationSelect}
      />
      
      {/* Right Panel - Map View */}
      <div className="flex-1 relative bg-black">
        {/* Map content */}
        <MapContent 
          currentView={currentView}
          selectedLocation={selectedLocation}
          onMapReady={() => setIsMapReady(true)}
          onFlyComplete={handleFlyComplete}
          onLocationSelect={handleLocationSelect}
        />
        
        {/* Sync status indicator */}
        <div className="absolute bottom-5 right-5 z-[10001]">
          <SyncStatusIndicator />
        </div>
      </div>
    </div>
  );
};

export default GeoSpatialExplorer;
