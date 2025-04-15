
import React, { useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Location, LocationMarker, saveMarker, getSavedMarkers, deleteMarker } from '@/utils/geo-utils';
import { v4 as uuidv4 } from 'uuid';
import { setupLeafletIcons } from './map/LeafletMapIcons';
import MapEvents from './map/MapEvents';
import MapReference from './map/MapReference';
import DrawingControls from './map/DrawingControls';
import MarkersList from './map/MarkersList';
import { useBuildings } from '@/hooks/useBuildings';
import BuildingDialog from './map/BuildingDialog';
import { useMapState } from '@/hooks/useMapState';
import { MapLayers } from './map/MapLayers';
import { MapInitializer } from './map/MapInitializer';
import { toast } from 'sonner';

setupLeafletIcons();

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
}

const LeafletMap = ({ selectedLocation, onMapReady, activeTool }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const {
    position,
    zoom,
    markers,
    setMarkers,
    tempMarker,
    setTempMarker,
    markerName,
    setMarkerName,
    markerType,
    setMarkerType
  } = useMapState(selectedLocation);

  const {
    showBuildingDialog,
    setShowBuildingDialog,
    currentDrawing,
    setCurrentDrawing,
    buildingName,
    setBuildingName,
    handleSaveBuilding,
    loadSavedBuildings
  } = useBuildings(mapRef, selectedLocation);

  const handleMapClick = (latlng: L.LatLng) => {
    if (activeTool === 'marker' || (!activeTool && !tempMarker)) {
      setTempMarker([latlng.lat, latlng.lng]);
      setMarkerName(selectedLocation?.label || 'New Building');
    }
  };

  const handleShapeCreated = (shape: any) => {
    if (shape.type === 'marker') {
      setTempMarker(shape.position);
      setMarkerName('New Marker');
    } else {
      setCurrentDrawing(shape);
      setBuildingName(selectedLocation?.label ? `Building at ${selectedLocation.label}` : 'New Building');
      setShowBuildingDialog(true);
    }
  };

  const handleSaveMarker = () => {
    if (!tempMarker || !markerName.trim()) return;
    
    const newMarker: LocationMarker = {
      id: uuidv4(),
      name: markerName,
      position: tempMarker,
      type: markerType,
      createdAt: new Date()
    };
    
    saveMarker(newMarker);
    setMarkers([...markers, newMarker]);
    setTempMarker(null);
    setMarkerName('');
    toast.success("Location saved successfully");
  };

  const handleDeleteMarker = (id: string) => {
    deleteMarker(id);
    setMarkers(markers.filter(marker => marker.id !== id));
    toast.success("Location removed");
  };

  const handleSetMapRef = (map: L.Map) => {
    mapRef.current = map;
    if (onMapReady) {
      onMapReady(map);
    }
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        className="w-full h-full"
        attributionControl={false}
        center={position}
        zoom={zoom}
      >
        <MapReference onMapReady={handleSetMapRef} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AttributionControl position="bottomright" prefix={false} />
        
        {mapRef.current && (
          <>
            <MapLayers map={mapRef.current} />
            <MapInitializer 
              map={mapRef.current}
              selectedLocation={selectedLocation}
              onMapReady={onMapReady}
            />
          </>
        )}
        
        <DrawingControls 
          onCreated={handleShapeCreated} 
          activeTool={activeTool || null}
        />
        
        <MarkersList
          markers={markers}
          tempMarker={tempMarker}
          markerName={markerName}
          markerType={markerType}
          onDeleteMarker={handleDeleteMarker}
          onSaveMarker={handleSaveMarker}
          setMarkerName={setMarkerName}
          setMarkerType={setMarkerType}
        />
        
        <MapEvents onMapClick={handleMapClick} />
      </MapContainer>

      <BuildingDialog
        show={showBuildingDialog}
        buildingName={buildingName}
        onBuildingNameChange={setBuildingName}
        onSave={handleSaveBuilding}
        onCancel={() => {
          setShowBuildingDialog(false);
          setCurrentDrawing(null);
        }}
      />
    </div>
  );
};

export default LeafletMap;
