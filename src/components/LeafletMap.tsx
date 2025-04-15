
import React, { useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Location } from '@/utils/geo-utils';
import { setupLeafletIcons } from './map/LeafletMapIcons';
import MapEvents from './map/MapEvents';
import MapReference from './map/MapReference';
import DrawingControls from './map/DrawingControls';
import MarkersList from './map/MarkersList';
import BuildingDialog from './map/BuildingDialog';
import { useMapState } from '@/hooks/useMapState';
import { MapLayers } from './map/MapLayers';
import { MapInitializer } from './map/MapInitializer';
import { useMarkers } from '@/hooks/useMarkers';
import { useDrawing } from '@/hooks/useDrawing';

setupLeafletIcons();

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
}

const LeafletMap = ({ selectedLocation, onMapReady, activeTool }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const { position, zoom } = useMapState(selectedLocation);
  const {
    markers,
    tempMarker,
    markerName,
    markerType,
    setMarkerName,
    setMarkerType,
    handleSaveMarker,
    handleDeleteMarker,
    handleMapClick
  } = useMarkers();

  const {
    showDrawingDialog,
    setShowDrawingDialog,
    currentDrawing,
    drawingName,
    setDrawingName,
    handleCreatedShape,
    handleSaveDrawing
  } = useDrawing();

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
          onCreated={handleCreatedShape}
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
        
        <MapEvents onMapClick={(latlng) => handleMapClick(latlng, activeTool)} />
      </MapContainer>

      <BuildingDialog
        show={showDrawingDialog}
        buildingName={drawingName}
        onBuildingNameChange={setDrawingName}
        onSave={handleSaveDrawing}
        onCancel={() => {
          setShowDrawingDialog(false);
          setCurrentDrawing(null);
        }}
      />
    </div>
  );
};

export default LeafletMap;
