
import { useState, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Location, LocationMarker, saveMarker, getSavedMarkers, deleteMarker } from '@/utils/geo-utils';
import { v4 as uuidv4 } from 'uuid';
import { setupLeafletIcons } from './map/LeafletMapIcons';
import MapEvents from './map/MapEvents';
import MapReference from './map/MapReference';
import DrawingControls from './map/DrawingControls';
import MarkersList from './map/MarkersList';
import { useMapEvents } from '@/hooks/useMapEvents';

// Initialize leaflet icons
setupLeafletIcons();

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
}

const LeafletMap = ({ selectedLocation, onMapReady }: LeafletMapProps) => {
  const [position, setPosition] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.y, selectedLocation.x] : [51.505, -0.09]
  );
  const [zoom, setZoom] = useState(18);
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('building');
  const mapRef = useRef<L.Map | null>(null);
  const [drawingMode, setDrawingMode] = useState<string | null>(null);

  useMapEvents(mapRef.current, selectedLocation);

  const handleMapClick = (latlng: L.LatLng) => {
    if (drawingMode === 'marker' || !drawingMode) {
      setTempMarker([latlng.lat, latlng.lng]);
      setMarkerName(selectedLocation?.label || 'New Building');
    }
  };

  const handleSaveMarker = () => {
    if (!tempMarker || !markerName.trim()) return;
    
    const newMarker: LocationMarker = {
      id: uuidv4(),
      name: markerName,
      position: tempMarker,
      type: markerType,
      createdAt: new Date()
    };
    
    saveMarker(newMarker);
    setMarkers([...markers, newMarker]);
    setTempMarker(null);
    setMarkerName('');
  };

  const handleDeleteMarker = (id: string) => {
    deleteMarker(id);
    setMarkers(markers.filter(marker => marker.id !== id));
  };

  const handleSetMapRef = (map: L.Map) => {
    mapRef.current = map;
    if (onMapReady) {
      onMapReady(map);
    }
    if (selectedLocation) {
      map.flyTo([selectedLocation.y, selectedLocation.x], 18);
    }
  };

  const handleShapeCreated = (shape: any) => {
    if (shape.type === 'marker') {
      setTempMarker(shape.position);
      setMarkerName('New Marker');
    }
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        className="w-full h-full"
        attributionControl={false}
        {...{
          center: position,
          zoom: zoom
        } as any}
      >
        <MapReference onMapReady={handleSetMapRef} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AttributionControl position="bottomright" prefix={false} />
        
        <DrawingControls onCreated={handleShapeCreated} />
        
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
        
        <MapEvents onMapClick={handleMapClick} />
      </MapContainer>

      <div className="absolute bottom-24 right-4 bg-background/80 backdrop-blur-sm p-3 rounded-md shadow-md z-[1000]">
        <h3 className="font-medium text-sm mb-2">Draw Building Boundary</h3>
        <p className="text-xs text-muted-foreground mb-2">
          Click on the map to start marking building boundaries
        </p>
      </div>
    </div>
  );
};

export default LeafletMap;
