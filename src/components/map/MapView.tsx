
import { useState, useRef, useId } from 'react';
import { LocationMarker } from '@/utils/marker-utils';
import FloorPlanView from './FloorPlanView';
import { useFloorPlanState } from '@/hooks/useFloorPlanState';
import MapHeader from './header/MapHeader';
import MapContainer from './container/MapContainer';
import MapReference from './MapReference';
import DrawingControlsContainer from './drawing/DrawingControlsContainer';
import MarkersContainer from './marker/MarkersContainer';
import SelectedLocationMarker from './SelectedLocationMarker';
import MapEvents from './MapEvents';
import L from 'leaflet';

// Import leaflet CSS directly
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

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
  onClearAll?: () => void;
  isMapReady?: boolean;
  selectedLocation?: { x: number; y: number; label?: string };
  onClearSelectedLocation?: () => void;
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
  onRegionClick,
  onClearAll,
  isMapReady = false,
  selectedLocation,
  onClearSelectedLocation
}: MapViewProps) => {
  // Generate a stable ID unique to this component instance
  const instanceId = useId();
  // Use both instance ID and a timestamp for the map key to ensure uniqueness
  const [mapKey, setMapKey] = useState<string>(`${instanceId}-${Date.now()}`);
  const drawingControlsRef = useRef(null);
  const {
    showFloorPlan,
    setShowFloorPlan,
    selectedDrawing,
    handleRegionClick
  } = useFloorPlanState();

  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in MapView:", position);
    if (onLocationSelect) {
      onLocationSelect(position);
    }
  };

  if (showFloorPlan) {
    return (
      <FloorPlanView 
        onBack={() => setShowFloorPlan(false)} 
        drawing={selectedDrawing}
      />
    );
  }

  return (
    <div className="w-full h-full relative">
      <MapHeader 
        onLocationSelect={handleLocationSelect} 
        isMapReady={isMapReady} 
      />
      
      <MapContainer
        position={position}
        zoom={zoom}
        mapKey={mapKey}
      >
        <MapReference onMapReady={onMapReady} />
        
        {/* Show red marker for selected location */}
        {selectedLocation && (
          <SelectedLocationMarker
            position={[selectedLocation.y, selectedLocation.x]}
            label={selectedLocation.label || 'Selected Location'}
            onClose={onClearSelectedLocation}
          />
        )}
        
        <DrawingControlsContainer
          ref={drawingControlsRef}
          onShapeCreated={onShapeCreated}
          activeTool={activeTool}
          onRegionClick={handleRegionClick}
          onClearAll={onClearAll}
        />
        
        <MarkersContainer
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
