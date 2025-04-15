
import React, { useState, useRef, useEffect } from 'react';
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

  const {
    showBuildingDialog,
    setShowBuildingDialog,
    currentDrawing,
    setCurrentDrawing,
    buildingName,
    setBuildingName,
    handleSaveBuilding
  } = useBuildings(mapRef, selectedLocation);
  
  useEffect(() => {
    const loadedMarkers = getSavedMarkers();
    if (loadedMarkers && loadedMarkers.length > 0) {
      setMarkers(loadedMarkers);
    }
  }, []);

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
    
    // Add OSM Buildings layer with CORS error handling
    addOsmBuildingsLayer(map);
  };

  // Separate function to add OSM Buildings layer with error handling
  const addOsmBuildingsLayer = (map: L.Map) => {
    const probeUrl = 'https://tile.osmbuildings.org/0.2/dixw8kmb/tile/1/1/1.json';
    
    // Use a simple HEAD request first to check availability without triggering CORS errors
    fetch(probeUrl, { 
      method: 'HEAD',
      mode: 'no-cors' // This prevents CORS errors during the test
    })
    .then(() => {
      // If we get here, the service might be available, try to add the layer
      try {
        L.tileLayer('https://tile.osmbuildings.org/0.2/dixw8kmb/tile/{z}/{x}/{y}.png', {
          attribution: '© OSM Buildings',
          maxZoom: 19
        }).addTo(map);
        
        console.log("OSM Buildings layer added");
      } catch (error) {
        console.warn("Error adding OSM Buildings layer:", error);
        addFallbackLayer(map);
      }
    })
    .catch(error => {
      console.warn("OSM Buildings service unavailable:", error);
      addFallbackLayer(map);
    });
  };

  // Fallback layer if OSM Buildings is unavailable
  const addFallbackLayer = (map: L.Map) => {
    console.log("Using fallback map layer");
    
    // Create a dedicated pane for buildings to control layer order
    map.createPane('buildings');
    if (map.getPane('buildings')) {
      map.getPane('buildings').style.zIndex = '450';
    }
    
    // Add standard OpenStreetMap layer as fallback
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      pane: 'buildings',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    
    toast.info("Using standard map. 3D buildings unavailable.", {
      duration: 3000
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
