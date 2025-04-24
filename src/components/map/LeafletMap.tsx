
import { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Location, LocationMarker, saveMarker, getSavedMarkers, deleteMarker, DrawingData, saveDrawing } from '@/utils/geo-utils';
import { v4 as uuidv4 } from 'uuid';
import { setupLeafletIcons } from './LeafletMapIcons';
import { useMapState } from '@/hooks/useMapState';
import { useMapEvents } from '@/hooks/useMapEvents';
import { toast } from 'sonner';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
}

const LeafletMap = ({ selectedLocation, onMapReady, activeTool }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const loadedMarkersRef = useRef(false);
  
  const {
    position,
    zoom,
    markers,
    setMarkers,
    tempMarker,
    setTempMarker,
    markerName,
    setMarkerName,
    markerType,
    setMarkerType,
    currentDrawing,
    setCurrentDrawing,
    showFloorPlan,
    setShowFloorPlan,
    selectedDrawing,
    setSelectedDrawing
  } = useMapState(selectedLocation);

  useMapEvents(mapRef.current, selectedLocation);
  
  useEffect(() => {
    const loadSavedData = () => {
      // Only load markers from localStorage if they haven't been loaded already
      // or if this is triggered by a storage event (which means data changed)
      if (!loadedMarkersRef.current || event?.type === 'storage' || event?.type === 'markersUpdated') {
        const loadedMarkers = getSavedMarkers();
        if (loadedMarkers && loadedMarkers.length > 0) {
          setMarkers(loadedMarkers);
        }
        
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
  }, [setMarkers]);

  const handleMapClick = (latlng: L.LatLng) => {
    if (activeTool === 'marker' || (!activeTool && !tempMarker)) {
      setTempMarker([latlng.lat, latlng.lng]);
      setMarkerName(selectedLocation?.label || 'New Building');
    }
  };

  const handleShapeCreated = (shape: any) => {
    if (shape.type === 'marker') {
      setTempMarker(shape.position);
      setMarkerName('New Marker');
    } else {
      setCurrentDrawing(shape);
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
      createdAt: new Date(),
      associatedDrawing: currentDrawing ? currentDrawing.id : undefined
    };
    
    // Save to storage but don't update state directly
    saveMarker(newMarker);
    
    if (currentDrawing) {
      saveDrawing({
        ...currentDrawing,
        properties: {
          ...currentDrawing.properties,
          name: markerName,
          associatedMarkerId: newMarker.id
        }
      });
    }
    
    setTempMarker(null);
    setMarkerName('');
    setCurrentDrawing(null);
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

  const handleRegionClick = (drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  };

  if (showFloorPlan) {
    return <FloorPlanView onBack={() => setShowFloorPlan(false)} drawing={selectedDrawing} />;
  }

  return (
    <MapView
      position={position}
      zoom={zoom}
      markers={markers}
      tempMarker={tempMarker}
      markerName={markerName}
      markerType={markerType}
      onMapReady={handleSetMapRef}
      onLocationSelect={handleLocationSelect}
      onMapClick={handleMapClick}
      onDeleteMarker={handleDeleteMarker}
      onSaveMarker={handleSaveMarker}
      setMarkerName={setMarkerName}
      setMarkerType={setMarkerType}
      onShapeCreated={handleShapeCreated}
      activeTool={activeTool || null}
      onRegionClick={handleRegionClick}
    />
  );
};

export default LeafletMap;
