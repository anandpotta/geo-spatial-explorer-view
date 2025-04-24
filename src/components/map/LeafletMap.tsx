
import { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMapState } from '@/hooks/useMapState';
import { useMapEvents } from '@/hooks/useMapEvents';
import { useLeafletMapInitialization } from '@/hooks/useLeafletMapInitialization';
import { useLeafletMapNavigation } from '@/hooks/useLeafletMapNavigation';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { useMapReferenceHandler } from '@/hooks/useMapReferenceHandler';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import MapCleanup from './MapCleanup';

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
  const {
    mapRef,
    mapInstanceKey,
    isMapInitialized,
    mapReadyAttempts,
    cleanupInProgress,
    mapInitializedSuccessfully,
    mapContainerId,
    setIsMapInitialized,
    setMapReadyAttempts,
    resetMap
  } = useLeafletMapInitialization();

  const { safeMapFlyTo, handleLocationSelect } = useLeafletMapNavigation();
  const mapState = useMapState(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);

  const handleSetMapRef = useMapReferenceHandler(
    mapRef,
    isMapInitialized,
    cleanupInProgress,
    setIsMapInitialized,
    mapInitializedSuccessfully,
    mapReadyAttempts,
    setMapReadyAttempts,
    onMapReady
  );

  // Handle location changes
  useEffect(() => {
    if (selectedLocation && mapRef.current && isMapInitialized && !cleanupInProgress.current) {
      try {
        const lat = selectedLocation.y;
        const lng = selectedLocation.x;
        
        if (isNaN(lat) || isNaN(lng)) {
          console.error('Invalid coordinates:', { lat, lng });
          toast.error('Invalid location coordinates');
          return;
        }
        
        console.log('Flying to location:', { lat, lng });
        
        setTimeout(() => {
          const flySuccess = safeMapFlyTo(mapRef.current, isMapInitialized, cleanupInProgress.current, lat, lng, 18);
          
          if (!flySuccess) {
            console.warn('Safe flyTo failed, recreating map');
            resetMap();
          }
        }, 500);
      } catch (err) {
        console.error('Error flying to location:', err);
        resetMap();
      }
    }
  }, [selectedLocation, isMapInitialized, safeMapFlyTo, resetMap]);

  // Use mapEvents hook with safeguards
  useMapEvents(isMapInitialized ? mapRef.current : null, selectedLocation);

  const handleSavedLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    handleLocationSelect(position, onLocationSelect);
    
    const [lat, lng] = position;
    if (mapRef.current && isMapInitialized && !cleanupInProgress.current) {
      try {
        setTimeout(() => safeMapFlyTo(mapRef.current, isMapInitialized, cleanupInProgress.current, lat, lng), 200);
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  };

  if (mapState.showFloorPlan) {
    return (
      <FloorPlanView 
        onBack={() => mapState.setShowFloorPlan(false)} 
        drawing={mapState.selectedDrawing}
      />
    );
  }

  return (
    <>
      <MapCleanup
        mapInstanceKey={mapInstanceKey}
        mapRef={mapRef}
        cleanupInProgress={cleanupInProgress}
        mapContainerId={mapContainerId}
      />
      <MapView
        key={`map-view-${mapInstanceKey}`}
        position={mapState.position}
        zoom={mapState.zoom}
        markers={mapState.markers}
        tempMarker={mapState.tempMarker}
        markerName={mapState.markerName}
        markerType={mapState.markerType}
        onMapReady={handleSetMapRef}
        onLocationSelect={handleSavedLocationSelect}
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
    </>
  );
};

export default LeafletMap;

