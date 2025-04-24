
import { useState } from 'react';
import { LocationMarker } from '@/utils/marker-utils';
import { DrawingData } from '@/utils/drawing-utils';
import FloorPlanView from './FloorPlanView';
import MapCore from './core/MapContainer';
import MapControlsOverlay from './controls/MapControlsOverlay';
import MapReference from './MapReference';
import MapEvents from './MapEvents';
import DrawingControlsContainer from './drawing/DrawingControlsContainer';
import MarkersContainer from './marker/MarkersContainer';
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
  mapContainerId?: string;
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
  mapContainerId = 'leaflet-map'
}: MapViewProps) => {
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingData | null>(null);

  const handleRegionClick = (drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  };

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

  const uniqueMapId = `${mapContainerId}-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="w-full h-full relative">
      <MapControlsOverlay onLocationSelect={handleLocationSelect} />
      
      <MapCore 
        position={position}
        zoom={zoom}
        uniqueMapId={uniqueMapId}
        onMapReady={onMapReady}
      >
        <MapReference onMapReady={onMapReady} />
        
        <DrawingControlsContainer
          onShapeCreated={onShapeCreated}
          activeTool={activeTool}
          onRegionClick={onRegionClick}
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
      </MapCore>
    </div>
  );
};

export default MapView;
