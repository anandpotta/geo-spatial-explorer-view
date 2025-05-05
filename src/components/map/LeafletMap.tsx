
import { useEffect, useCallback } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { setupLeafletIcons } from './LeafletMapIcons';
import { useMapState } from '@/hooks/useMapState';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { getSavedMarkers } from '@/utils/marker-utils';
import MapView from './MapView';
import FloorPlanHandler from './FloorPlanHandler';
import { useLeafletMapInitialization } from '@/hooks/useLeafletMapInitialization';
import LocationHandler from './LocationHandler';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
  onLocationSelect?: (location: Location) => void;
  onClearAll?: () => void;
}

const LeafletMap = ({ selectedLocation, onMapReady, activeTool, onLocationSelect, onClearAll }: LeafletMapProps) => {
  const mapState = useMapState(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  
  const { 
    mapRef, 
    isMapReady, 
    mapInstanceKey, 
    containerId,
    handleSetMapRef, 
    handleLocationSelect,
    forceMapRemount
  } = useLeafletMapInitialization({
    selectedLocation,
    onMapReady
  });
  
  // Setup Leaflet icons
  useEffect(() => {
    setupLeafletIcons();
  }, []);

  // Load markers once on mount, not on every render
  useEffect(() => {
    const savedMarkers = getSavedMarkers();
    mapState.setMarkers(savedMarkers);
  }, []);

  // If selectedLocation changes, handle it with better remounting approach
  useEffect(() => {
    if (selectedLocation) {
      forceMapRemount();
    }
  }, [selectedLocation?.id]);

  const handleClearAll = useCallback(() => {
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    
    if (onClearAll) {
      onClearAll();
    }
  }, [mapState, onClearAll]);

  return (
    <>
      <FloorPlanHandler
        showFloorPlan={mapState.showFloorPlan}
        selectedDrawing={mapState.selectedDrawing}
        onBack={() => mapState.setShowFloorPlan(false)}
      />
      
      {!mapState.showFloorPlan && (
        <MapView
          key={mapInstanceKey}
          containerKey={mapInstanceKey}
          containerID={containerId}
          position={mapState.position}
          zoom={mapState.zoom}
          markers={mapState.markers}
          tempMarker={mapState.tempMarker}
          markerName={mapState.markerName}
          markerType={mapState.markerType}
          onMapReady={handleSetMapRef}
          onLocationSelect={(position) => handleLocationSelect(position)}
          onMapClick={handleMapClick}
          onDeleteMarker={mapState.handleDeleteMarker}
          onSaveMarker={mapState.handleSaveMarker}
          setMarkerName={mapState.setMarkerName}
          setMarkerType={mapState.setMarkerType}
          onShapeCreated={handleShapeCreated}
          activeTool={activeTool || mapState.activeTool}
          onRegionClick={mapState.handleRegionClick}
          onClearAll={handleClearAll}
          isMapReady={isMapReady}
        />
      )}
      
      <LocationHandler
        handleLocationSelect={handleLocationSelect}
        onLocationSelect={onLocationSelect}
      />
    </>
  );
};

export default LeafletMap;
