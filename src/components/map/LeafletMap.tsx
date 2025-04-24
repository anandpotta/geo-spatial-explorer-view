
import { useState, useRef } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { useMapState } from '@/hooks/useMapState';
import { useMapEvents } from '@/hooks/useMapEvents';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useMarkerUpdates } from '@/hooks/useMarkerUpdates';
import { useLocationSelection } from '@/hooks/useLocationSelection';
import { useMapReference } from '@/hooks/useMapReference';
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

const LeafletMap = ({ selectedLocation, onMapReady, activeTool, onLocationSelect }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const mapContainerIdRef = useRef<string>(`map-container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  
  const mapState = useMapState(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  
  // Initialize map and handle cleanup
  useMapInitialization(mapInstanceKey, mapState);
  
  // Handle marker updates
  useMarkerUpdates(mapState.setMarkers);
  
  // Handle location selection
  useLocationSelection(selectedLocation, mapRef, () => {
    setMapInstanceKey(Date.now());
    mapContainerIdRef.current = `map-container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  });

  const handleSetMapRef = useMapReference(mapRef, selectedLocation, onMapReady);

  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    if (mapRef.current) {
      try {
        // Use flyTo with animation for smooth transition
        mapRef.current.flyTo(position, 18, {
          animate: true,
          duration: 1.5
        });
        
        if (onLocationSelect) {
          const location: Location = {
            id: `loc-${position[0]}-${position[1]}`,
            label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
            x: position[1],
            y: position[0]
          };
          onLocationSelect(location);
        }
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  };

  const handleClearAll = () => {
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    
    if (mapRef.current) {
      try {
        mapRef.current.invalidateSize();
      } catch (err) {
        console.error('Error invalidating map size:', err);
      }
    }
  };

  if (mapState.showFloorPlan) {
    return <FloorPlanView onBack={() => mapState.setShowFloorPlan(false)} drawing={mapState.selectedDrawing} />;
  }

  return (
    <MapView
      key={`map-view-${mapInstanceKey}`}
      containerId={mapContainerIdRef.current}
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
