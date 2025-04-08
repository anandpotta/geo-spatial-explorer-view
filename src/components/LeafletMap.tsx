
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, LocationMarker, saveMarker, getSavedMarkers, deleteMarker } from '@/utils/geo-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Cross, MapPin, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Fix Leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LeafletMapProps {
  selectedLocation?: Location;
}

// Custom map events component
const MapEvents = ({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
};

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

  // Simple draw implementation without react-leaflet-draw
  const drawingRef = useRef<{
    isDrawing: boolean;
    points: L.LatLng[];
    layer?: L.Polyline;
  }>({
    isDrawing: false,
    points: [],
  });

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={position} 
        zoom={zoom} 
        className="w-full h-full"
        whenReady={(mapEvent) => handleSetMapRef(mapEvent.target)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User-created markers */}
        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <div className="p-1">
                <h3 className="font-medium">{marker.name}</h3>
                <p className="text-xs text-muted-foreground">{marker.type}</p>
                <p className="text-xs">
                  {marker.position[0].toFixed(6)}, {marker.position[1].toFixed(6)}
                </p>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleDeleteMarker(marker.id)}
                >
                  <Trash2 size={14} className="mr-1" /> Remove
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Temporary marker for new pins */}
        {tempMarker && (
          <Marker position={tempMarker}>
            <Popup>
              <div className="p-2">
                <Input 
                  type="text"
                  placeholder="Location name"
                  value={markerName}
                  onChange={(e) => setMarkerName(e.target.value)}
                  className="mb-2"
                />
                <div className="flex mb-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={markerType === 'pin' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setMarkerType('pin')}
                  >
                    Pin
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={markerType === 'area' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setMarkerType('area')}
                  >
                    Area
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={markerType === 'building' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setMarkerType('building')}
                  >
                    Building
                  </Button>
                </div>
                <Button 
                  onClick={handleSaveMarker}
                  disabled={!markerName.trim()}
                  className="w-full"
                >
                  Save Location
                </Button>
              </div>
            </Popup>
          </Marker>
        )}
        
        <MapEvents onMapClick={handleMapClick} />
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
