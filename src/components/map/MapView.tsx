
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import SavedLocationsDropdown from './SavedLocationsDropdown';
import MapReference from './MapReference';
import DrawingControls from './DrawingControls';
import MarkersList from './MarkersList';
import MapEvents from './MapEvents';
import { LocationMarker } from '@/utils/marker-utils';
import L from 'leaflet';

interface MapViewProps {
  position: [number, number];
  zoom: number;
  markers: LocationMarker[];
  tempMarker: [number, number] | null;
  markerName: string;
  markerType: 'pin' | 'area' | 'building';
  onMapReady: (map: L.Map) => void;
  onLocationSelect: (position: [number, number]) => void;
  onMapClick: (latlng: L.LatLng) => void;
  onDeleteMarker: (id: string) => void;
  onSaveMarker: () => void;
  setMarkerName: (name: string) => void;
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onShapeCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick: (drawing: any) => void;
}

const MapView = ({
  position,
  zoom,
  markers,
  tempMarker,
  markerName,
  markerType,
  onMapReady,
  onLocationSelect,
  onMapClick,
  onDeleteMarker,
  onSaveMarker,
  setMarkerName,
  setMarkerType,
  onShapeCreated,
  activeTool,
  onRegionClick
}: MapViewProps) => {
  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 right-4 z-[1000]">
        <SavedLocationsDropdown onLocationSelect={onLocationSelect} />
      </div>
      
      <MapContainer 
        className="w-full h-full"
        attributionControl={false}
        center={position}
        zoom={zoom}
      >
        <MapReference onMapReady={onMapReady} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AttributionControl position="bottomright" prefix={false} />
        
        <DrawingControls 
          onCreated={onShapeCreated}
          activeTool={activeTool}
          onRegionClick={onRegionClick}
        />
        
        <MarkersList
          markers={markers}
          tempMarker={tempMarker}
          markerName={markerName}
          markerType={markerType}
          onDeleteMarker={onDeleteMarker}
          onSaveMarker={onSaveMarker}
          setMarkerName={setMarkerName}
          setMarkerType={setMarkerType}
        />
        
        <MapEvents onMapClick={onMapClick} />
      </MapContainer>
    </div>
  );
};

export default MapView;
