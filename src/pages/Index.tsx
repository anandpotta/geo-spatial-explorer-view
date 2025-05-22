
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

  // Get view management functionality with flyCompleted state
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
    if (selectedLocation && currentView === 'leaflet' && leafletMapRef.current) {
      setTimeout(() => {
        if (leafletMapRef.current && leafletMapRef.current.invalidateSize) {
          console.log('Forcing Leaflet map refresh from Index');
          leafletMapRef.current.invalidateSize(true);
        }
      }, 300);
    }
  };
  
  const handleCesiumViewerRef = (viewer: any) => {
    cesiumViewerRef.current = viewer;
    console.log('Cesium viewer reference set', viewer ? 'successfully' : 'failed');
  };
  
  const handleLeafletMapRef = (map: any) => {
    leafletMapRef.current = map;
    console.log('Leaflet map reference set', map ? 'successfully' : 'failed');
  };
  
  // Log state for debugging
  console.log(`Index: Current view: ${currentView}, flyCompleted: ${flyCompleted}, has location: ${!!selectedLocation}`);

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
        flyCompleted={flyCompleted}
        key={`${mapKey}-${currentView}-${leafletRefreshTrigger}`} // Force recreation with current view and refresh trigger
      />
    </div>
  );
};

export default Index;
