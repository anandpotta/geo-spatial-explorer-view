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
  selectedLocation?: { x: number; y: number };
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
  
  const { handleMarkerCreation, handleMarkerDeletion, handleMarkerRename } = useMarkerHandlers(onMarkerCreate);
  
  useMapInitialization(mapRef, savedLocations, savedDrawings);
  useMapEvents(mapInstance, selectedLocation);
  
  const { handleUploadToDrawing } = useDrawingFileUpload();

  const handleMapClick = useCallback((latlng: L.LatLng) => {
    if (activeTool === 'marker') {
      handleMarkerCreation(latlng);
    } else if (onLocationSelect) {
      onLocationSelect({ x: latlng.lng, y: latlng.lat });
    }
  }, [activeTool, handleMarkerCreation, onLocationSelect]);

  const handleShapeCreated = (shape: any) => {
    console.log('Shape Created:', shape);
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
        whenCreated={setMapInstance}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapEvents 
          onMapClick={handleMapClick} 
          onPathClick={handlePathClick}
        />

        {userLocation && (
          <UserMarker position={[userLocation.y, userLocation.x]} />
        )}

        {tempMarker && (
          <TempMarker position={[tempMarker.y, tempMarker.x]} />
        )}

        {selectedLocation && (
          <SelectedLocationMarker position={[selectedLocation.y, selectedLocation.x]} />
        )}
        
        <DrawingControls
          ref={drawingControlsRef}
          onCreated={handleShapeCreated}
          activeTool={activeTool}
          onRegionClick={handleRegionClick}
          onClearAll={onClearAll}
          onRemoveShape={onRemoveShape}
          onUploadToDrawing={handleUploadToDrawing}
          onPathsUpdated={onPathsUpdated}
        />
        
        <MarkersList />
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
