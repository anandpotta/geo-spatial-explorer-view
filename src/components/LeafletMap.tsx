
import React, { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Location } from '@/utils/geo-utils';
import { setupLeafletIcons } from './map/LeafletMapIcons';
import MapEvents from './map/MapEvents';
import MapReference from './map/MapReference';
import DrawingControls from './map/DrawingControls';
import MarkersList from './map/markers/MarkersList';
import BuildingDialog from './map/buildings/BuildingDialog';
import ShapeTools from './drawing/ShapeTools';
import { useMapState } from '@/hooks/useMapState';
import { MapLayers } from './map/layers/MapLayers';
import { MapInitializer } from './map/MapInitializer';
import { useMarkers } from '@/hooks/useMarkers';
import { useDrawing } from '@/hooks/useDrawing';
import { getAllSavedBuildings } from '@/utils/building-utils';

setupLeafletIcons();

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
  selectedBuildingId?: string | null;
}

const LeafletMap = ({ selectedLocation, onMapReady, activeTool, selectedBuildingId }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const { position, zoom } = useMapState(selectedLocation);
  const [localActiveTool, setLocalActiveTool] = useState<string | null>(activeTool || null);
  
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
    handleSaveDrawing,
    setCurrentDrawing
  } = useDrawing();

  const handleSetMapRef = (map: L.Map) => {
    mapRef.current = map;
    if (onMapReady) {
      onMapReady(map);
    }
  };

  // Effect to fly to building location if selectedBuildingId changes
  useEffect(() => {
    if (selectedBuildingId && mapRef.current) {
      const buildings = getAllSavedBuildings();
      const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
      
      if (selectedBuilding && selectedBuilding.location) {
        mapRef.current.flyTo(
          [selectedBuilding.location.y, selectedBuilding.location.x], 
          18, 
          { animate: true, duration: 1 }
        );
      }
    }
  }, [selectedBuildingId]);

  // Update local tool state when prop changes
  React.useEffect(() => {
    setLocalActiveTool(activeTool || null);
  }, [activeTool]);

  const handleToolSelect = (tool: string) => {
    setLocalActiveTool(tool);
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
          activeTool={localActiveTool || null}
          selectedBuildingId={selectedBuildingId}
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
        
        <MapEvents onMapClick={(latlng) => handleMapClick(latlng, localActiveTool)} />
      </MapContainer>

      <div className="absolute right-4 top-4 z-[1000]">
        <ShapeTools 
          activeTool={localActiveTool} 
          onToolSelect={handleToolSelect}
        />
      </div>

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
