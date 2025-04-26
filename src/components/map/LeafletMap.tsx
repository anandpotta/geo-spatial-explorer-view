
import { useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMapState } from '@/hooks/useMapState';
import { useMapEvents } from '@/hooks/useMapEvents';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useLocationSelection } from '@/hooks/useLocationSelection';
import { useClearMapLayers } from '@/hooks/useClearMapLayers';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

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
  const mapState = useMapState(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  
  const { 
    mapRef, 
    mapInstanceKey, 
    setMapInstanceKey, 
    handleSetMapRef 
  } = useMapInitialization(selectedLocation, onMapReady);

  const { handleLocationSelect } = useLocationSelection(mapRef, onLocationSelect);
  
  const { handleClearAll } = useClearMapLayers({
    mapRef,
    setMapInstanceKey,
    setTempMarker: mapState.setTempMarker,
    setMarkerName: mapState.setMarkerName,
    setMarkerType: mapState.setMarkerType,
    setCurrentDrawing: mapState.setCurrentDrawing,
    setShowFloorPlan: mapState.setShowFloorPlan,
    setSelectedDrawing: mapState.setSelectedDrawing,
    setMarkers: mapState.setMarkers,
    setDrawings: mapState.setDrawings
  });

  useEffect(() => {
    if (selectedLocation && mapRef.current) {
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
        setMapInstanceKey(Date.now());
      }
    }
  }, [selectedLocation, mapRef, setMapInstanceKey]);

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
      key={`map-view-${mapInstanceKey}`}
      position={mapState.position}
      zoom={mapState.zoom}
      markers={mapState.markers}
      tempMarker={mapState.tempMarker}
      markerName={mapState.markerName}
      markerType={mapState.markerType}
      onMapReady={handleSetMapRef}
      onLocationSelect={handleLocationSelect}
      onMapClick={handleMapClick}
      onDeleteMarker={mapState.handleDeleteMarker}
      onSaveMarker={mapState.handleSaveMarker}
      setMarkerName={mapState.setMarkerName}
      setMarkerType={mapState.setMarkerType}
      onShapeCreated={handleShapeCreated}
      activeTool={activeTool || mapState.activeTool}
      onRegionClick={mapState.handleRegionClick}
      onClearAll={handleClearAll}
    />
  );
};

export default LeafletMap;
