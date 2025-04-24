
import { useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useToast } from '@/components/ui/use-toast';
import ExplorerSidebar from './explorer/ExplorerSidebar';
import MapContent from './explorer/MapContent';
import SyncStatusIndicator from './SyncStatusIndicator';

const GeoSpatialExplorer = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [currentView, setCurrentView] = useState<'cesium' | 'leaflet' | 'globe'>('globe');
  const [isMapReady, setIsMapReady] = useState(false);
  const [flyCompleted, setFlyCompleted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (isMapReady) {
      console.log('Map is ready for interactions');
    }
  }, [isMapReady]);
  
  const handleLocationSelect = (location: Location) => {
    console.log('Location selected in Explorer:', location);
    setSelectedLocation(location);
    setIsTransitioning(true);
    
    // Start transition sequence
    if (currentView === 'globe') {
      toast({
        title: 'Starting journey',
        description: `Traveling to ${location.label || 'selected location'}`,
        duration: 3000,
      });
      
      // Transition from globe to Cesium with a slight delay
      setTimeout(() => {
        setCurrentView('cesium');
        setFlyCompleted(false);
      }, 500);
    } else {
      setCurrentView('cesium');
      setFlyCompleted(false);
      
      toast({
        title: 'Location selected',
        description: `Navigating to ${location.label}`,
        duration: 3000,
      });
    }
  };
  
  const handleFlyComplete = () => {
    console.log('Fly complete in Explorer, transition to map view');
    setFlyCompleted(true);
    
    // Add a smoother transition between Cesium and Leaflet views
    setTimeout(() => {
      setCurrentView('leaflet');
      setIsTransitioning(false);
      toast({
        title: 'Destination reached',
        description: 'You can now explore the area or draw boundaries on the map',
        duration: 5000,
      });
    }, 800); // Slightly longer delay for smoother transition
  };
  
  const handleSavedLocationSelect = (position: [number, number]) => {
    const location: Location = {
      id: `loc-${position[0]}-${position[1]}`,
      label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
      y: position[0],
      x: position[1]
    };
    
    setSelectedLocation(location);
    setIsTransitioning(true);
    setCurrentView('cesium');
    setFlyCompleted(false);
    
    toast({
      title: 'Starting journey',
      description: `Traveling to ${location.label}`,
      duration: 3000,
    });
  };
  
  return (
    <div className="w-full h-screen flex bg-black overflow-hidden">
      <ExplorerSidebar 
        selectedLocation={selectedLocation}
        currentView={currentView}
        flyCompleted={flyCompleted}
        setCurrentView={setCurrentView}
        onSavedLocationSelect={handleSavedLocationSelect}
        isTransitioning={isTransitioning}
      />
      
      <div className="flex-1 relative bg-black">
        <MapContent 
          currentView={currentView}
          selectedLocation={selectedLocation}
          onMapReady={() => setIsMapReady(true)}
          onFlyComplete={handleFlyComplete}
          onLocationSelect={handleLocationSelect}
          isTransitioning={isTransitioning}
        />
        
        <div className="absolute bottom-5 right-5 z-[10001]">
          <SyncStatusIndicator />
        </div>
      </div>
    </div>
  );
};

export default GeoSpatialExplorer;
