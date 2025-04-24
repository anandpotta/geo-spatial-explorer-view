
import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, AttributionControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Location, LocationMarker, saveMarker, getSavedMarkers, deleteMarker, DrawingData, getSavedDrawings } from '@/utils/geo-utils';
import { v4 as uuidv4 } from 'uuid';
import { setupLeafletIcons } from './map/LeafletMapIcons';
import MapEvents from './map/MapEvents';
import MapReference from './map/MapReference';
import DrawingControls from './map/DrawingControls';
import MarkersList from './map/MarkersList';
import { useMapEvents } from '@/hooks/useMapEvents';
import { toast } from 'sonner';
import SavedLocationsDropdown from './map/SavedLocationsDropdown';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
}

const LeafletMap = ({ selectedLocation, onMapReady, activeTool }: LeafletMapProps) => {
  const [position, setPosition] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.y, selectedLocation.x] : [51.505, -0.09]
  );
  const [zoom, setZoom] = useState(18);
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('building');
  const mapRef = useRef<L.Map | null>(null);
  
  // Load saved markers and drawings when the component mounts
  useEffect(() => {
    const loadSavedData = () => {
      const loadedMarkers = getSavedMarkers();
      if (loadedMarkers && loadedMarkers.length > 0) {
        setMarkers(loadedMarkers);
      }
      
      const loadedDrawings = getSavedDrawings();
      if (loadedDrawings && loadedDrawings.length > 0) {
        setDrawings(loadedDrawings);
      }
    };
    
    loadSavedData();
    
    // Listen for storage changes
    window.addEventListener('storage', loadSavedData);
    return () => window.removeEventListener('storage', loadSavedData);
  }, []);

  // Connect to map events for location changes
  useMapEvents(mapRef.current, selectedLocation);

  const handleMapClick = (latlng: L.LatLng) => {
    // Only handle map clicks for creating markers if the polygon tool isn't active
    if (activeTool === 'marker' || (!activeTool && !tempMarker)) {
      setTempMarker([latlng.lat, latlng.lng]);
      setMarkerName(selectedLocation?.label || 'New Building');
    }
  };

  const handleShapeCreated = (shape: any) => {
    console.log("Shape created:", shape);
    
    if (shape.type === 'marker') {
      setTempMarker(shape.position);
      setMarkerName('New Marker');
    } else {
      // For shapes like polygons, circles, etc.
      toast.success(`${shape.type} created - Click to tag this building`);
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
    toast.success("Location saved successfully");
  };

  const handleDeleteMarker = (id: string) => {
    deleteMarker(id);
    setMarkers(markers.filter(marker => marker.id !== id));
    toast.success("Location removed");
  };

  const handleSetMapRef = (map: L.Map) => {
    mapRef.current = map;
    if (onMapReady) {
      onMapReady(map);
    }
    if (selectedLocation) {
      map.flyTo([selectedLocation.y, selectedLocation.x], 18);
    }
    
    // Setup Leaflet icons after map is ready
    setupLeafletIcons();
  };

  const handleLocationSelect = (position: [number, number]) => {
    if (mapRef.current) {
      mapRef.current.flyTo(position, 18, {
        duration: 2
      });
    }
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 right-4 z-[1000]">
        <SavedLocationsDropdown onLocationSelect={handleLocationSelect} />
      </div>
      
      <MapContainer 
        className="w-full h-full"
        attributionControl={false}
        center={position}
        zoom={zoom}
      >
        <MapReference onMapReady={handleSetMapRef} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AttributionControl position="bottomright" prefix={false} />
        
        {/* Drawing controls with active tool passed down */}
        <DrawingControls 
          onCreated={handleShapeCreated} 
          activeTool={activeTool || null}
        />
        
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
    </div>
  );
};

export default LeafletMap;
