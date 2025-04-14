
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, AttributionControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Location, LocationMarker, saveMarker, getSavedMarkers, deleteMarker } from '@/utils/geo-utils';
import { v4 as uuidv4 } from 'uuid';
import { setupLeafletIcons } from './map/LeafletMapIcons';
import MapEvents from './map/MapEvents';
import UserMarker from './map/UserMarker';
import TempMarker from './map/TempMarker';
import { EditControl } from "react-leaflet-draw";

// Initialize leaflet icons
setupLeafletIcons();

// Custom component to get map instance
const MapRef = ({ onMapReady }: { onMapReady: (map: L.Map) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  return null;
};

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
}

const LeafletMap = ({ selectedLocation, onMapReady }: LeafletMapProps) => {
  const [position, setPosition] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.y, selectedLocation.x] : [51.505, -0.09]
  );
  const [zoom, setZoom] = useState(18); // Increase default zoom level for building view
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('building'); // Set building as default
  const mapRef = useRef<L.Map | null>(null);
  const [drawingMode, setDrawingMode] = useState<string | null>(null);

  // Load saved markers on mount
  useEffect(() => {
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
  }, []);

  // Update position when selected location changes
  useEffect(() => {
    if (selectedLocation) {
      console.log('Selected location in Leaflet map:', selectedLocation);
      const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
      setPosition(newPosition);
      
      // Fly to the new position if map is ready
      if (mapRef.current) {
        console.log('Flying to position in Leaflet:', newPosition);
        mapRef.current.flyTo(newPosition, 18, { // Higher zoom for building level detail
          animate: true,
          duration: 1.5
        });
      }
    }
  }, [selectedLocation]);

  // Update drawing mode when parent component requests it
  useEffect(() => {
    if (drawingMode && mapRef.current) {
      // Enable the appropriate drawing mode
      console.log('Enabling drawing mode:', drawingMode);
    }
  }, [drawingMode]);

  const handleMapClick = (latlng: L.LatLng) => {
    // Only create markers when in marker mode or no specific tool is selected
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
    
    // Pass map reference to parent if callback provided
    if (onMapReady) {
      onMapReady(map);
    }
    
    // If we already have a selected location, fly to it
    if (selectedLocation) {
      const newPosition: [number, number] = [selectedLocation.y, selectedLocation.x];
      map.flyTo(newPosition, 18); // Higher zoom for building level detail
    }
  };

  const handleCreated = (e: any) => {
    const { layerType, layer } = e;
    
    if (layerType === 'marker') {
      const { lat, lng } = layer.getLatLng();
      setTempMarker([lat, lng]);
      setMarkerName('New Marker');
    } else {
      // For shapes like polygons, circles, etc.
      console.log('Created shape:', layerType, layer);
      // Here you can save the shape to your state or database
      const id = uuidv4();
      layer.options.id = id;
      
      // You could save the GeoJSON representation
      const geoJSON = layer.toGeoJSON();
      console.log('GeoJSON:', geoJSON);
      
      // Show a toast notification
      // toast.success(`${layerType} created successfully`);
    }
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        className="w-full h-full"
        attributionControl={false}
        // Use type assertion to avoid TypeScript error with center and zoom props
        {...{
          center: position,
          zoom: zoom
        } as any}
      >
        <MapRef onMapReady={handleSetMapRef} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AttributionControl position="bottomright" prefix={false} />
        
        {/* Leaflet Draw control */}
        <EditControl
          position="topright"
          onCreated={handleCreated}
          draw={{
            rectangle: true,
            polygon: true,
            circle: true,
            circlemarker: false,
            marker: true,
            polyline: true
          }}
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
