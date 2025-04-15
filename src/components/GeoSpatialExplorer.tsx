
import { useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useToast } from '@/components/ui/use-toast';
import ExplorerSidebar from './explorer/ExplorerSidebar';
import MapContent from './explorer/MapContent';
import SyncStatusIndicator from './SyncStatusIndicator';
import { Building } from '@/utils/building-utils';

const GeoSpatialExplorer = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
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
    
    // Reset selected building when changing location
    setSelectedBuildingId(null);
    setSelectedBuilding(null);
    
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
      id: `loc-${position[0]}-${position[1]}`, // Adding required id property
      label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
      y: position[0],
      x: position[1]
    };
    
    setSelectedLocation(location);
    setCurrentView('cesium'); // Start with Cesium view for the full experience
    setFlyCompleted(false);
  };
  
  const handleBuildingSelect = (building: Building) => {
    setSelectedBuildingId(building.id);
    setSelectedBuilding(building);
    
    // If we're not in Leaflet view, switch to it after Cesium view
    if (currentView !== 'leaflet') {
      setCurrentView('cesium');
      setFlyCompleted(false);
      
      // Make sure we have the location set
      setSelectedLocation(building.location);
      
      // We'll transition to leaflet view after fly complete
      toast({
        title: 'Building selected',
        description: `Navigating to ${building.name}`,
        duration: 3000,
      });
    } else {
      // If already in leaflet view, just highlight the building
      toast({
        title: 'Building selected',
        description: `${building.name} highlighted on map`,
        duration: 3000,
      });
    }
  };
  
  return (
    <div className="w-full h-screen flex bg-black overflow-hidden">
      {/* Left Panel */}
      <ExplorerSidebar 
        selectedLocation={selectedLocation}
        selectedBuilding={selectedBuilding}
        currentView={currentView}
        flyCompleted={flyCompleted}
        setCurrentView={setCurrentView}
        onSavedLocationSelect={handleSavedLocationSelect}
        onBuildingSelect={handleBuildingSelect}
      />
      
      {/* Right Panel - Map View */}
      <div className="flex-1 relative bg-black">
        {/* Map content */}
        <MapContent 
          currentView={currentView}
          selectedLocation={selectedLocation}
          selectedBuildingId={selectedBuildingId}
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
