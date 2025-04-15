
import { useState, useEffect } from 'react';
import { Location } from '@/utils/location/types';
import { useToast } from '@/components/ui/use-toast';
import ExplorerSidebar from './explorer/ExplorerSidebar';
import MapContent from './explorer/MapContent';
import SyncStatusIndicator from './SyncStatusIndicator';
import { Building } from '@/utils/building-utils';
import { v4 as uuidv4 } from 'uuid';

const GeoSpatialExplorer = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [currentView, setCurrentView] = useState<'cesium' | 'leaflet'>('cesium'); // Always start with cesium
  const [isMapReady, setIsMapReady] = useState(false);
  const [flyCompleted, setFlyCompleted] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (isMapReady) {
      console.log('Map is ready for interactions');
    }
  }, [isMapReady]);
  
  const handleLocationSelect = (location: Location) => {
    console.log('Location selected in Explorer:', location);
    setSelectedLocation(location);
    
    setSelectedBuildingId(null);
    setSelectedBuilding(null);
    
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
    const location: Location = {
      id: uuidv4(), // Generate unique ID for this location
      label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
      y: position[0],
      x: position[1]
    };
    
    setSelectedLocation(location);
    setCurrentView('cesium');
    setFlyCompleted(false);
  };
  
  const handleBuildingSelect = (building: Building) => {
    setSelectedBuildingId(building.id);
    setSelectedBuilding(building);
    
    if (currentView !== 'leaflet') {
      setCurrentView('cesium');
      setFlyCompleted(false);
      
      setSelectedLocation(building.location);
      
      toast({
        title: 'Building selected',
        description: `Navigating to ${building.name}`,
        duration: 3000,
      });
    } else {
      toast({
        title: 'Building selected',
        description: `${building.name} highlighted on map`,
        duration: 3000,
      });
    }
  };
  
  return (
    <div className="w-full h-screen flex bg-black overflow-hidden">
      <ExplorerSidebar 
        selectedLocation={selectedLocation}
        selectedBuilding={selectedBuilding}
        currentView={currentView}
        flyCompleted={flyCompleted}
        setCurrentView={setCurrentView}
        onSavedLocationSelect={handleSavedLocationSelect}
        onBuildingSelect={handleBuildingSelect}
      />
      
      <div className="flex-1 relative bg-black">
        <MapContent 
          currentView={currentView}
          selectedLocation={selectedLocation}
          selectedBuildingId={selectedBuildingId}
          onMapReady={() => setIsMapReady(true)}
          onFlyComplete={handleFlyComplete}
          onLocationSelect={handleLocationSelect}
        />
        
        <div className="absolute bottom-5 right-5 z-[10001]">
          <SyncStatusIndicator />
        </div>
      </div>
    </div>
  );
};

export default GeoSpatialExplorer;
