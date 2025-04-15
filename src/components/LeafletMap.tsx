
import React, { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Location } from '@/utils/location/types';
import { setupLeafletIcons, setupDrawingStyles } from './map/LeafletMapIcons';
import MapEvents from './map/MapEvents';
import MapReference from './map/MapReference';
import DrawingControls from './map/DrawingControls';
import MarkersList from './map/markers/MarkersList';
import BuildingDialog from './map/buildings/BuildingDialog';
import { useMapState } from '@/hooks/useMapState';
import { MapLayers } from './map/layers/MapLayers';
import { MapInitializer } from './map/MapInitializer';
import { useMarkers } from '@/hooks/useMarkers';
import { useDrawing } from '@/hooks/useDrawing';
import { useMapEvents } from '@/hooks/useMapEvents';
import { getAllSavedBuildings } from '@/utils/building-utils';
import { toast } from 'sonner';

// Initialize Leaflet icons and drawing styles
setupLeafletIcons();
setupDrawingStyles();

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
    console.log('Map reference set:', map);
    mapRef.current = map;
    if (onMapReady) {
      onMapReady(map);
    }
  };

  useMapEvents(mapRef.current, selectedLocation);

  useEffect(() => {
    if (selectedBuildingId && mapRef.current) {
      const buildings = getAllSavedBuildings();
      const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
      
      if (selectedBuilding && selectedBuilding.location) {
        console.log('Flying to building:', selectedBuilding.name);
        mapRef.current.flyTo(
          [selectedBuilding.location.y, selectedBuilding.location.x], 
          18, 
          { animate: true, duration: 1 }
        );
        
        toast.success(`Viewing: ${selectedBuilding.name}`);
      }
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    setLocalActiveTool(activeTool || null);
  }, [activeTool]);

  const handleToolSelect = (tool: string) => {
    console.log('Tool selected:', tool);
    setLocalActiveTool(prev => prev === tool ? null : tool);
  };
  
  // This is important to ensure the drawing tools are initialized properly
  useEffect(() => {
    if (mapRef.current) {
      // Force a resize to ensure the map is properly sized
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
    }
  }, [mapRef.current]);

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        className="w-full h-full z-0"
        attributionControl={false}
        center={position}
        zoom={zoom}
        zoomControl={false}
        style={{ zIndex: 0 }}
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

      {showDrawingDialog && (
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
      )}
    </div>
  );
};

export default LeafletMap;
