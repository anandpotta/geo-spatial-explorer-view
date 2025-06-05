
import { useEffect, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { useMapState } from '@/hooks/useMapState';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useLocationSelection } from '@/hooks/useLocationSelection';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { getSavedMarkers } from '@/utils/marker-utils';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import { setupLeafletIcons } from './LeafletMapIcons';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
  onLocationSelect?: (location: Location) => void;
  onClearAll?: () => void;
  onClearSelectedLocation?: () => void;
}

const LeafletMap = ({ 
  selectedLocation, 
  onMapReady, 
  activeTool, 
  onLocationSelect, 
  onClearAll,
  onClearSelectedLocation 
}: LeafletMapProps) => {
  // ALL hooks must be called in the same order every time
  const [isMapReferenceSet, setIsMapReferenceSet] = useState(false);
  const [instanceKey, setInstanceKey] = useState<number>(Date.now());
  
  // Generate a unique instance ID for this component instance to avoid container reuse
  const uniqueInstanceId = useMemo(() => `leaflet-map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Custom hooks - ALWAYS call these in the same order
  const mapState = useMapState(selectedLocation);
  const { 
    mapRef, 
    mapInstanceKey, 
    isMapReady, 
    handleSetMapRef,
    resetMapInstance 
  } = useMapInitialization(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  const { handleLocationSelect, handleClearAll } = useLocationSelection(mapRef, isMapReady, onLocationSelect);

  // Initialize Leaflet icons - ALWAYS call this effect
  useEffect(() => {
    setupLeafletIcons();
  }, []);

  // Reset map if there are errors - ALWAYS define this callback
  const forceReset = useCallback(() => {
    console.log("Forcing map reset");
    setInstanceKey(Date.now());
    resetMapInstance();
    setIsMapReferenceSet(false);
  }, [resetMapInstance]);

  // Handle markers updates - ALWAYS call this effect
  useEffect(() => {
    const handleMarkersUpdated = () => {
      const savedMarkers = getSavedMarkers();
      mapState.setMarkers(savedMarkers);
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
    };
  }, [mapState]);

  // Handle selected location changes - ALWAYS call this effect
  useEffect(() => {
    if (selectedLocation && mapRef.current && isMapReady && isMapReferenceSet) {
      try {
        const container = mapRef.current.getContainer();
        if (container && document.body.contains(container)) {
          console.log('Flying to selected location:', selectedLocation);
          mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
            animate: true,
            duration: 1.5
          });
        }
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  }, [selectedLocation, isMapReady, isMapReferenceSet]);

  // Custom map reference handler - ALWAYS define this callback
  const handleMapRefWrapper = useCallback((map: L.Map) => {
    console.log('Map ref wrapper called');
    handleSetMapRef(map);
    setIsMapReferenceSet(true);
    
    // Only call parent onMapReady once when the map is first ready
    if (onMapReady && !isMapReferenceSet) {
      onMapReady(map);
    }
  }, [handleSetMapRef, onMapReady, isMapReferenceSet]);

  // Clear all layers and reset state - ALWAYS define this callback
  const handleClearAllWrapper = useCallback(() => {
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    
    if (onClearAll) {
      onClearAll();
    }
    
    handleClearAll();
  }, [mapState, onClearAll, handleClearAll]);

  if (mapState.showFloorPlan) {
    return (
      <FloorPlanView 
        onBack={() => mapState.setShowFloorPlan(false)} 
        drawing={mapState.selectedDrawing}
      />
    );
  }

  return (
    <MapView
      key={`map-view-${uniqueInstanceId}-${mapInstanceKey}-${instanceKey}`}
      position={mapState.position}
      zoom={mapState.zoom}
      markers={mapState.markers}
      tempMarker={mapState.tempMarker}
      markerName={mapState.markerName}
      markerType={mapState.markerType}
      onMapReady={handleMapRefWrapper}
      onLocationSelect={handleLocationSelect}
      onMapClick={handleMapClick}
      onDeleteMarker={mapState.handleDeleteMarker}
      onSaveMarker={mapState.handleSaveMarker}
      setMarkerName={mapState.setMarkerName}
      setMarkerType={mapState.setMarkerType}
      onShapeCreated={handleShapeCreated}
      activeTool={activeTool || mapState.activeTool}
      onRegionClick={mapState.handleRegionClick}
      onClearAll={handleClearAllWrapper}
      isMapReady={isMapReady}
      selectedLocation={selectedLocation}
      onClearSelectedLocation={onClearSelectedLocation}
    />
  );
};

export default LeafletMap;
