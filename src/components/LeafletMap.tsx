
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
import { toast } from 'sonner';
import { useBuildings } from '@/hooks/useBuildings';
import BuildingDialog from './map/BuildingDialog';

// Initialize leaflet icons
setupLeafletIcons();

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
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('building');
  const mapRef = useRef<L.Map | null>(null);

  // Use the buildings hook
  const {
    showBuildingDialog,
    setShowBuildingDialog,
    currentDrawing,
    setCurrentDrawing,
    buildingName,
    setBuildingName,
    handleSaveBuilding
  } = useBuildings(mapRef, selectedLocation);
  
  // Load saved markers when the component mounts
  useEffect(() => {
    const loadedMarkers = getSavedMarkers();
    if (loadedMarkers && loadedMarkers.length > 0) {
      setMarkers(loadedMarkers);
    }
  }, []);

  // Connect to map events for location changes
  useMapEvents(mapRef.current, selectedLocation);

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
      setBuildingName(selectedLocation?.label ? `Building at ${selectedLocation.label}` : 'New Building');
      setShowBuildingDialog(true);
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
    
    // Add OSM Buildings layer for 3D building visualization
    fetch('https://tile.osmbuildings.org/0.2/dixw8kmb/tile/{z}/{x}/{y}.json')
      .then(response => {
        if (response.ok) {
          L.tileLayer('https://tile.osmbuildings.org/0.2/dixw8kmb/tile/{z}/{x}/{y}.png', {
            attribution: '© OSM Buildings',
            maxZoom: 19
          }).addTo(map);
          
          console.log("OSM Buildings layer added successfully");
        } else {
          console.log("OSM Buildings service not available, using fallback");
          map.createPane('buildings');
          map.getPane('buildings')!.style.zIndex = '450';
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            pane: 'buildings',
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
        }
      })
      .catch(error => {
        console.error("Error adding OSM Buildings layer:", error);
        toast.error("Could not load 3D buildings. Using standard map.");
      });
  };

  return (
    <div className="w-full h-full relative">
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

      <BuildingDialog
        show={showBuildingDialog}
        buildingName={buildingName}
        onBuildingNameChange={setBuildingName}
        onSave={handleSaveBuilding}
        onCancel={() => {
          setShowBuildingDialog(false);
          setCurrentDrawing(null);
        }}
      />
    </div>
  );
};

export default LeafletMap;
