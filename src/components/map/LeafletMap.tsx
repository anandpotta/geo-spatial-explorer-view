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
import { Button } from "@/components/ui/button";
import { FlipHorizontal } from "lucide-react";

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
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingData | null>(null);

  const handleRegionClick = (drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  };
  
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

  if (showFloorPlan) {
    return (
      <div className="relative w-full h-full">
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="outline"
            onClick={() => setShowFloorPlan(false)}
            className="bg-white/80 backdrop-blur-sm"
          >
            <FlipHorizontal className="mr-2 h-4 w-4" />
            Back to Map
          </Button>
        </div>
        <div className="w-full h-full flex items-center justify-center bg-black/5">
          <img
            src="https://images.unsplash.com/photo-1473177104440-ffee2f376098"
            alt="Floor Plan"
            className="max-h-[90%] max-w-[90%] object-contain rounded-lg shadow-lg"
          />
        </div>
      </div>
    );
  }

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
        
        <DrawingControls 
          onCreated={handleShapeCreated} 
          activeTool={activeTool || null}
          onRegionClick={handleRegionClick}
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
