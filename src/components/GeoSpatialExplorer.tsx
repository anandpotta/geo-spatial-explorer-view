
import { useState } from 'react';
import { Location } from '@/utils/geo-utils';
import { useToast } from '@/components/ui/use-toast';
import ExplorerSidebar from './explorer/ExplorerSidebar';
import MapContent from './explorer/MapContent';

const GeoSpatialExplorer = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [currentView, setCurrentView] = useState<'cesium' | 'leaflet'>('cesium');
  const [isMapReady, setIsMapReady] = useState(false);
  const [flyCompleted, setFlyCompleted] = useState(false);
  const { toast } = useToast();
  
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setCurrentView('cesium');
    setFlyCompleted(false);
    
    toast({
      title: 'Location selected',
      description: location.label,
      duration: 3000,
    });
  };
  
  const handleFlyComplete = () => {
    setFlyCompleted(true);
    setCurrentView('leaflet');
    
    toast({
      title: 'Navigation complete',
      description: 'Switched to detailed map view',
      duration: 3000,
    });
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
    setCurrentView('leaflet'); // Go directly to leaflet view for saved locations
  };
  
  return (
    <div className="w-full h-screen flex bg-background">
      {/* Left Panel */}
      <ExplorerSidebar 
        selectedLocation={selectedLocation}
        currentView={currentView}
        flyCompleted={flyCompleted}
        setCurrentView={setCurrentView}
        onSavedLocationSelect={handleSavedLocationSelect}
      />
      
      {/* Right Panel - Map View */}
      <div className="flex-1 relative">
        {/* Map content */}
        <MapContent 
          currentView={currentView}
          selectedLocation={selectedLocation}
          onMapReady={() => setIsMapReady(true)}
          onFlyComplete={handleFlyComplete}
          onLocationSelect={handleLocationSelect}
        />
      </div>
    </div>
  );
};

export default GeoSpatialExplorer;
