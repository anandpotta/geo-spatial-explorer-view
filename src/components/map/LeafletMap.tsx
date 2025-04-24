
import { useEffect, useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMapState } from '@/hooks/useMapState';
import { useMapEvents } from '@/hooks/useMapEvents';
import { useLeafletMapInitialization } from '@/hooks/useLeafletMapInitialization';
import { useLeafletMapNavigation } from '@/hooks/useLeafletMapNavigation';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { useMapReferenceHandler } from '@/hooks/useMapReferenceHandler';
import { useLocationSelectionHandler } from '@/hooks/useLocationSelectionHandler';
import MapView from './MapView';
import MapCleanup from './MapCleanup';
import FloorPlanViewHandler from './FloorPlanViewHandler';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
  onLocationSelect?: (location: Location) => void;
}

const LeafletMap = ({ 
  selectedLocation, 
  onMapReady, 
  activeTool, 
  onLocationSelect 
}: LeafletMapProps) => {
  // Initialize map state and refs
  const {
    mapRef,
    mapInstanceKey,
    isMapInitialized,
    cleanupInProgress,
    mapInitializedSuccessfully,
    mapContainerId,
    setIsMapInitialized,
    setMapReadyAttempts,
    resetMap
  } = useLeafletMapInitialization();

  const { safeMapFlyTo, handleLocationSelect, initialNavigationDone, resetNavigationState } = useLeafletMapNavigation();
  const mapState = useMapState(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  
  // Initialize handlers
  const handleSetMapRef = useMapReferenceHandler(
    mapRef,
    isMapInitialized,
    cleanupInProgress,
    setIsMapInitialized,
    mapInitializedSuccessfully,
    0,
    setMapReadyAttempts,
    onMapReady
  );

  const handleSavedLocationSelect = useLocationSelectionHandler(
    mapRef,
    isMapInitialized,
    cleanupInProgress
  );

  // Use map events hook with safeguards
  useMapEvents(isMapInitialized ? mapRef.current : null, selectedLocation, initialNavigationDone);

  // Reset marker tracking when component mounts
  useEffect(() => {
    window.tempMarkerPlaced = false;
    window.userHasInteracted = false;
    
    return () => {
      delete window.tempMarkerPlaced;
      delete window.userHasInteracted;
    };
  }, []);

  return (
    <>
      <MapCleanup
        mapInstanceKey={mapInstanceKey}
        mapRef={mapRef}
        cleanupInProgress={cleanupInProgress}
        mapContainerId={mapContainerId}
      />
      <FloorPlanViewHandler
        showFloorPlan={mapState.showFloorPlan}
        selectedDrawing={mapState.selectedDrawing}
        onBack={() => mapState.setShowFloorPlan(false)}
      />
      {!mapState.showFloorPlan && (
        <MapView
          key={`map-view-${mapInstanceKey}`}
          position={mapState.position}
          zoom={mapState.zoom}
          markers={mapState.markers}
          tempMarker={mapState.tempMarker}
          markerName={mapState.markerName}
          markerType={mapState.markerType}
          onMapReady={handleSetMapRef}
          onLocationSelect={(pos) => handleSavedLocationSelect(pos, onLocationSelect)}
          onMapClick={handleMapClick}
          onDeleteMarker={mapState.handleDeleteMarker}
          onSaveMarker={mapState.handleSaveMarker}
          setMarkerName={mapState.setMarkerName}
          setMarkerType={mapState.setMarkerType}
          onShapeCreated={handleShapeCreated}
          activeTool={activeTool || mapState.activeTool}
          onRegionClick={mapState.handleRegionClick}
          onClearAll={mapState.handleClearAll}
          mapContainerId={mapContainerId.current}
        />
      )}
    </>
  );
};

export default LeafletMap;
