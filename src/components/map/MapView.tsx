import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import SavedLocationsDropdown from './SavedLocationsDropdown';
import MapReference from './MapReference';
import MapEvents from './MapEvents';
import { LocationMarker } from '@/utils/marker-utils';
import L from 'leaflet';
import DrawingControlsContainer from './drawing/DrawingControlsContainer';
import MarkersContainer from './marker/MarkersContainer';
import FloorPlanView from './FloorPlanView';
import { useState, useRef, useEffect, useMemo } from 'react';
import { DrawingData } from '@/utils/drawing-utils';
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
  containerKey?: string;
  containerID?: string;
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
  containerKey = 'default-map',
  containerID
}: MapViewProps) => {
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingData | null>(null);
  const drawingControlsRef = useRef(null);
  const instanceId = useMemo(() => `map-instance-${Date.now().toString(36)}`, []);
  
  // Use a stable reference for markers with useMemo to avoid unnecessary rerenders
  const stableMarkers = useMemo(() => {
    // Deduplicate markers by ID to ensure no duplicates are passed down
    const uniqueMarkers = new Map<string, LocationMarker>();
    markers.forEach(marker => {
      if (marker && marker.id) {
        uniqueMarkers.set(marker.id, marker);
      }
    });
    return Array.from(uniqueMarkers.values());
  }, [markers]);

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

  // Use provided containerID or generate a truly unique ID
  const uniqueContainerId = containerID || `${containerKey}-${Date.now()}`;
  
  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 right-4 z-[1000]">
        <SavedLocationsDropdown 
          onLocationSelect={handleLocationSelect} 
          isMapReady={isMapReady}
        />
      </div>
      
      <MapContainer 
        key={uniqueContainerId}
        id={uniqueContainerId}
        className="w-full h-full"
        attributionControl={false}
        center={position}
        zoom={zoom}
        zoomControl={false}
        fadeAnimation={true}
        markerZoomAnimation={true}
        preferCanvas={false} // Ensure SVG rendering is used
        renderer={L.svg()} // Force SVG renderer for the whole map
        whenReady={() => {
          // Force immediate resize to ensure proper container dimensions
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 100);
        }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          maxZoom={19}
          subdomains={['a', 'b', 'c']}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          className="leaflet-tile-pane"
        />
        <AttributionControl position="bottomright" prefix={false} />
        
        <MapReference onMapReady={onMapReady} mapKey={containerKey} />
        
        <DrawingControlsContainer
          ref={drawingControlsRef}
          onShapeCreated={onShapeCreated}
          activeTool={activeTool}
          onRegionClick={handleRegionClick}
          onClearAll={onClearAll}
        />
        
        <MarkersContainer
          key={`markers-container-${instanceId}`}
          markers={stableMarkers}
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
