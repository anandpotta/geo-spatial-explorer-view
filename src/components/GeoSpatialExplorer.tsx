
import { useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useToast } from '@/components/ui/use-toast';
import ExplorerSidebar from './explorer/ExplorerSidebar';
import MapContent from './explorer/MapContent';
import SyncStatusIndicator from './SyncStatusIndicator';
import { SidebarProvider } from '@/components/ui/sidebar';

const GeoSpatialExplorer = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [currentView, setCurrentView] = useState<'cesium' | 'leaflet'>('cesium'); // Always start with cesium
  const [isMapReady, setIsMapReady] = useState(false);
  const [flyCompleted, setFlyCompleted] = useState(false);
  const { toast } = useToast();
  
  // Effect to handle initial map load
  useEffect(() => {
    if (isMapReady) {
      console.log('Map is ready for interactions');
    }
  }, [isMapReady]);
  
  const handleLocationSelect = (location: Location) => {
    console.log('Location selected in Explorer:', location);
    setSelectedLocation(location);
    
    // Always force cesium view when selecting a new location
    setCurrentView('cesium');
    setFlyCompleted(false);
    
    toast({
      title: 'Location selected',
      description: `Navigating to ${location.label}`,
      duration: 3000,
    });
  };
  
  const handleFlyComplete = () => {
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
  };
  
  const handleSavedLocationSelect = (position: [number, number]) => {
    // Create a simple location object from coordinates
    const location: Location = {
      id: `loc-${position[0]}-${position[1]}`,
      label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
      y: position[0],
      x: position[1]
    };
    
    setSelectedLocation(location);
    setCurrentView('cesium'); // Start with Cesium view for the full experience
    setFlyCompleted(false);
  };
  
  return (
    <SidebarProvider>
      <div className="w-full h-screen flex bg-black overflow-hidden">
        {/* Left Panel */}
        <ExplorerSidebar />
        
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
    </SidebarProvider>
  );
};

export default GeoSpatialExplorer;
