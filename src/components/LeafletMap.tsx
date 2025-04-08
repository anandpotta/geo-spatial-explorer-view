
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, LocationMarker, saveMarker, getSavedMarkers, deleteMarker } from '@/utils/geo-utils';
import { v4 as uuidv4 } from 'uuid';
import { setupLeafletIcons } from './map/LeafletMapIcons';
import MapEvents from './map/MapEvents';
import UserMarker from './map/UserMarker';
import TempMarker from './map/TempMarker';

// Initialize leaflet icons
setupLeafletIcons();

interface LeafletMapProps {
  selectedLocation?: Location;
}

const LeafletMap = ({ selectedLocation }: LeafletMapProps) => {
  const [position, setPosition] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.y, selectedLocation.x] : [51.505, -0.09]
  );
  const [zoom, setZoom] = useState(13);
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('pin');
  const mapRef = useRef<L.Map | null>(null);

  // Load saved markers on mount
  useEffect(() => {
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
  }, []);

  // Update position when selected location changes
  useEffect(() => {
    if (selectedLocation) {
      const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
      setPosition(newPosition);
      
      // Fly to the new position if map is ready
      if (mapRef.current) {
        mapRef.current.flyTo(newPosition, 14);
      }
    }
  }, [selectedLocation]);

  const handleMapClick = (latlng: L.LatLng) => {
    setTempMarker([latlng.lat, latlng.lng]);
    setMarkerName('');
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
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={position}
        zoom={zoom}
        className="w-full h-full"
        whenReady={(map) => handleSetMapRef(map.target)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* User-created markers */}
        {markers.map((marker) => (
          <UserMarker 
            key={marker.id} 
            marker={marker} 
            onDelete={handleDeleteMarker} 
          />
        ))}
        
        {/* Temporary marker for new pins */}
        {tempMarker && (
          <TempMarker 
            position={tempMarker}
            markerName={markerName}
            setMarkerName={setMarkerName}
            markerType={markerType}
            setMarkerType={setMarkerType}
            onSave={handleSaveMarker}
          />
        )}
        
        <MapEvents onMapClick={handleMapClick} />
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
