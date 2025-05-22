
import { useRef } from 'react';
import MapContent from '@/components/explorer/MapContent';
import ExplorerSidebar from '@/components/explorer/ExplorerSidebar';
import { useLocationManagement } from '@/hooks/useLocationManagement';
import { useMapViewManagement } from '@/hooks/useMapViewManagement';

const Index = () => {
  // Get location management functionality
  const {
    selectedLocation,
    flyCompleted,
    handleLocationSelect,
    handleFlyComplete,
    handleSavedLocationSelect
  } = useLocationManagement();

  // Get view management functionality
  const {
    currentView,
    mapKey,
    leafletRefreshTrigger,
    handleViewChange
  } = useMapViewManagement(selectedLocation, flyCompleted);

  // Map viewer references
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);

  const handleMapReady = () => {
    console.log('Map is ready');
    
    // If we have a location and we're in leaflet view, trigger a refresh
    if (selectedLocation && currentView === 'leaflet') {
      setTimeout(() => {
        leafletRefreshTrigger + 1;
      }, 300);
    }
  };
  
  const handleCesiumViewerRef = (viewer: any) => {
    cesiumViewerRef.current = viewer;
  };
  
  const handleLeafletMapRef = (map: any) => {
    leafletMapRef.current = map;
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
        handleCesiumViewerRef={handleCesiumViewerRef}
        handleLeafletMapRef={handleLeafletMapRef}
        key={`${mapKey}-${currentView}-${leafletRefreshTrigger}`} // Force recreation with current view and refresh trigger
      />
    </div>
  );
};

export default Index;
