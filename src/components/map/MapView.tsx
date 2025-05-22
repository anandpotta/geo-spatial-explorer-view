
import { useState, useRef, useEffect } from 'react';
import { LocationMarker } from '@/utils/marker-utils';
import FloorPlanView from './FloorPlanView';
import { useFloorPlanState } from '@/hooks/useFloorPlanState';
import MapHeader from './header/MapHeader';
import MapContainer from './container/MapContainer';
import MapReference from './MapReference';
import DrawingControlsContainer from './drawing/DrawingControlsContainer';
import MarkersContainer from './marker/MarkersContainer';
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
  isMapReady = false
}: MapViewProps) => {
  // Generate a stable but unique key
  const [mapKey, setMapKey] = useState<string>(`map-${Date.now()}`);
  const mapReadyRef = useRef<boolean>(false);
  const drawingControlsRef = useRef(null);
  const {
    showFloorPlan,
    setShowFloorPlan,
    selectedDrawing,
    handleRegionClick
  } = useFloorPlanState();

  // Reset map key whenever component remounts to ensure fresh instance
  useEffect(() => {
    console.log("MapView: Component mounted or updated");
    return () => {
      // Force a new key on unmount to ensure clean startup next time
      setMapKey(`map-${Date.now()}`);
      console.log("MapView: Component unmounted, resetting map key");
    };
  }, []);
  
  // Handle map ready internally to avoid duplicate notifications
  const handleMapReadyInternal = (map: L.Map) => {
    if (!mapReadyRef.current) {
      console.log("MapView: Map is ready, notifying parent");
      mapReadyRef.current = true;
      
      // Wait a brief moment to ensure the map is fully rendered
      setTimeout(() => {
        if (map && map.invalidateSize) {
          map.invalidateSize(true);
          console.log("MapView: Forced initial map invalidation");
        }
        
        // Notify parent component
        onMapReady(map);
      }, 100);
    }
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

  return (
    <div className="w-full h-full relative">
      <MapHeader 
        onLocationSelect={handleLocationSelect} 
        isMapReady={isMapReady || mapReadyRef.current} 
      />
      
      <div className="w-full h-full" id={`map-container-${mapKey}`}>
        <MapContainer
          position={position}
          zoom={zoom}
          mapKey={mapKey}
        >
          <MapReference onMapReady={handleMapReadyInternal} />
          
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
    </div>
  );
};

export default MapView;
