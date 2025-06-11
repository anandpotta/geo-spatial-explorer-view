
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { LocationMarker } from '@/utils/marker-utils';
import { DrawingData } from '@/utils/drawing-utils';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useMapEvents } from '@/hooks/useMapEvents';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { useDrawings } from '@/hooks/useDrawings';
import { useDrawingFileUpload } from '@/hooks/useDrawingFileUpload';
import MapEvents from './MapEvents';
import UserMarker from './UserMarker';
import TempMarker from './TempMarker';
import SelectedLocationMarker from './SelectedLocationMarker';
import DrawingControls from './DrawingControls';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';
import MarkersList from './MarkersList';

interface LeafletMapProps {
  selectedLocation?: { x: number; y: number; label?: string };
  tempMarker?: { x: number; y: number };
  userLocation?: { x: number; y: number };
  activeTool: string | null;
  onLocationSelect?: (location: { x: number; y: number }) => void;
  onMarkerCreate?: (marker: LocationMarker) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadToDrawing?: (drawingId: string, file: File) => void;
  onPathsUpdated?: (paths: string[]) => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  selectedLocation,
  tempMarker,
  userLocation,
  activeTool,
  onLocationSelect,
  onMarkerCreate,
  onClearAll,
  onRemoveShape,
  onUploadToDrawing,
  onPathsUpdated
}) => {
  const mapRef = useRef<L.Map>(null);
  const drawingControlsRef = useRef<DrawingControlsRef>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  
  const { savedLocations } = useSavedLocations();
  const { savedDrawings } = useDrawings();
  
  // Create a mock mapState object for useMarkerHandlers
  const mapState = {
    activeTool,
    tempMarker,
    selectedLocation,
    setTempMarker: () => {},
    setMarkerName: () => {},
    setCurrentDrawing: () => {}
  };
  
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  
  useMapInitialization(mapRef, savedLocations, savedDrawings);
  useMapEvents(mapInstance, selectedLocation);
  
  const { handleUploadToDrawing } = useDrawingFileUpload();

  const handleMapClickWrapper = useCallback((latlng: L.LatLng) => {
    if (activeTool === 'marker') {
      handleMapClick(latlng);
    } else if (onLocationSelect) {
      onLocationSelect({ x: latlng.lng, y: latlng.lat });
    }
  }, [activeTool, handleMapClick, onLocationSelect]);

  const handleShapeCreatedWrapper = (shape: any) => {
    console.log('Shape Created:', shape);
    handleShapeCreated(shape);
  };

  const handleRegionClick = (drawing: DrawingData) => {
    console.log('Region Clicked:', drawing);
  };

  const handlePathClick = useCallback((drawingId: string) => {
    console.log(`Path clicked for drawing: ${drawingId}`);
    if (drawingControlsRef.current) {
      drawingControlsRef.current.openFileUploadDialog(drawingId);
    }
  }, []);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="h-full w-full"
        ref={mapRef}
        zoomControl={true}
        attributionControl={true}
        whenReady={setMapInstance}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapEvents 
          onMapClick={handleMapClickWrapper} 
          onPathClick={handlePathClick}
        />

        {userLocation && (
          <UserMarker 
            marker={{
              id: 'user-location',
              name: 'Your Location',
              position: [userLocation.y, userLocation.x],
              type: 'pin'
            }}
            onDelete={() => {}}
          />
        )}

        {tempMarker && (
          <TempMarker 
            position={[tempMarker.y, tempMarker.x]}
            markerName="New Location"
            setMarkerName={() => {}}
            markerType="pin"
            setMarkerType={() => {}}
            onSave={() => {}}
          />
        )}

        {selectedLocation && (
          <SelectedLocationMarker 
            position={[selectedLocation.y, selectedLocation.x]}
            label={selectedLocation.label || 'Selected Location'}
          />
        )}
        
        <DrawingControls
          ref={drawingControlsRef}
          onCreated={handleShapeCreatedWrapper}
          activeTool={activeTool}
          onRegionClick={handleRegionClick}
          onClearAll={onClearAll}
          onRemoveShape={onRemoveShape}
          onUploadToDrawing={handleUploadToDrawing}
          onPathsUpdated={onPathsUpdated}
        />
        
        <MarkersList 
          markers={savedLocations}
          tempMarker={tempMarker ? [tempMarker.y, tempMarker.x] : null}
          markerName="New Location"
          markerType="pin"
          onDeleteMarker={() => {}}
          onSaveMarker={() => {}}
          setMarkerName={() => {}}
          setMarkerType={() => {}}
        />
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
