
import { useState } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { useMapState } from '@/hooks/useMapState';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useLocationSelection } from '@/hooks/useLocationSelection';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
}

const LeafletMap = ({ selectedLocation, onMapReady, activeTool }: LeafletMapProps) => {
  const mapState = useMapState(selectedLocation);
  const { mapRef, mapInstanceKey, setMapInstanceKey, mapInitialized, handleSetMapRef } = 
    useMapInitialization(selectedLocation, onMapReady);
  const { handleLocationSelect: baseHandleLocationSelect } = useLocationSelection();
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);

  const handleLocationSelect = (position: [number, number]) => {
    baseHandleLocationSelect(position, mapRef);
  };

  const handleClearAll = () => {
    console.log("Handling clear all in LeafletMap");
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    
    try {
      if (mapRef.current && mapRef.current.getContainer() && 
          document.body.contains(mapRef.current.getContainer())) {
        console.log('Invalidating map size safely');
        mapRef.current.invalidateSize({ animate: false, pan: false });
      }
    } catch (err) {
      console.error('Error invalidating map size:', err);
    }
    
    setTimeout(() => {
      setMapInstanceKey(Date.now());
    }, 300);
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
      activeTool={activeTool || null}
      onRegionClick={mapState.handleRegionClick}
      onClearAll={handleClearAll}
    />
  );
};

export default LeafletMap;
