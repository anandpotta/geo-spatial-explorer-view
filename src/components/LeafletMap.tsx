
import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Location, LocationMarker, saveMarker, getSavedMarkers, deleteMarker, DrawingData, getSavedDrawings } from '@/utils/geo-utils';
import { v4 as uuidv4 } from 'uuid';
import { setupLeafletIcons } from '@/components/map/LeafletMapIcons';
import MapEvents from '@/components/map/MapEvents';
import MapReference from '@/components/map/MapReference';
import DrawingControls from '@/components/map/DrawingControls';
import MarkersList from '@/components/map/MarkersList';
import { useMapEvents } from '@/hooks/useMapEvents';
import { toast } from 'sonner';
import SavedLocationsDropdown from '@/components/map/SavedLocationsDropdown';
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
  // Flag to prevent duplicate loading
  const loadedMarkersRef = useRef(false);

  const handleRegionClick = (drawing: DrawingData) => {
    console.log("Region clicked:", drawing);
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  };
  
  useEffect(() => {
    const loadSavedData = () => {
      // Only load markers from localStorage if they haven't been loaded already
      // or if this is triggered by a storage event (which means data changed)
      if (!loadedMarkersRef.current || event?.type === 'storage' || event?.type === 'markersUpdated') {
        const loadedMarkers = getSavedMarkers();
        setMarkers(loadedMarkers);
        
        const loadedDrawings = getSavedDrawings();
        setDrawings(loadedDrawings);
        
        // Set the flag to true after initial load
        loadedMarkersRef.current = true;
      }
    };
    
    loadSavedData();
    
    window.addEventListener('storage', loadSavedData);
    window.addEventListener('markersUpdated', loadSavedData);
    return () => {
      window.removeEventListener('storage', loadSavedData);
      window.removeEventListener('markersUpdated', loadSavedData);
    };
  }, []);

  useMapEvents(mapRef.current, selectedLocation);

  const handleMapClick = (latlng: L.LatLng) => {
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
    
    // Just save to storage, don't update the state directly
    // The state will be updated via the storage event listener
    saveMarker(newMarker);
    
    setTempMarker(null);
    setMarkerName('');
    toast.success("Location saved successfully");
  };

  const handleDeleteMarker = (id: string) => {
    deleteMarker(id);
    // No need to update state directly, the event listener will handle it
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
