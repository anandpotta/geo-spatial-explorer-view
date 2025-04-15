import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, AttributionControl, useMap } from 'react-leaflet';
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
import { saveBuilding, getSavedBuildings } from '@/utils/building-utils';

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
  const [showBuildingDialog, setShowBuildingDialog] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<any>(null);
  const [buildingName, setBuildingName] = useState('');
  
  // Load saved markers when the component mounts
  useEffect(() => {
    const loadedMarkers = getSavedMarkers();
    if (loadedMarkers && loadedMarkers.length > 0) {
      setMarkers(loadedMarkers);
    }
  }, []);

  // Connect to map events for location changes
  useMapEvents(mapRef.current, selectedLocation);

  // Load saved buildings when the location changes
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      const locationKey = `${selectedLocation.x.toFixed(4)}_${selectedLocation.y.toFixed(4)}`;
      const savedBuildings = getSavedBuildings(locationKey);
      
      // Clear previous buildings
      if (mapRef.current) {
        mapRef.current.eachLayer((layer: L.Layer) => {
          if (layer && 'options' in layer && layer.options && (layer.options as any).buildingId) {
            mapRef.current?.removeLayer(layer);
          }
        });
      }
      
      // Add saved buildings to the map
      savedBuildings.forEach(building => {
        try {
          const layer = L.geoJSON(building.geoJSON, {
            style: {
              color: '#3388ff',
              weight: 3,
              opacity: 0.7,
              fillColor: '#3388ff',
              fillOpacity: 0.3
            }
          }).addTo(mapRef.current || new L.Map(document.createElement('div')));
          
          // Add building ID for future reference
          if (layer && layer.options) {
            (layer.options as any).buildingId = building.id;
          }
          
          // Add popup with building name
          layer.bindPopup(building.name);
        } catch (error) {
          console.error("Error rendering saved building:", error);
        }
      });
      
      toast.info(`Loaded ${savedBuildings.length} buildings for this location`);
    }
  }, [selectedLocation]);

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
      // For shapes like polygons, circles, etc. that represent buildings
      setCurrentDrawing(shape);
      setBuildingName(selectedLocation?.label ? `Building at ${selectedLocation.label}` : 'New Building');
      setShowBuildingDialog(true);
    }
  };

  const handleSaveBuilding = () => {
    if (!currentDrawing || !buildingName.trim() || !selectedLocation) return;
    
    const locationKey = `${selectedLocation.x.toFixed(4)}_${selectedLocation.y.toFixed(4)}`;
    
    const buildingData = {
      id: currentDrawing.id || uuidv4(),
      name: buildingName,
      type: currentDrawing.type,
      geoJSON: currentDrawing.geoJSON,
      locationKey,
      location: {
        x: selectedLocation.x,
        y: selectedLocation.y,
        label: selectedLocation.label
      },
      createdAt: new Date()
    };
    
    saveBuilding(buildingData);
    setCurrentDrawing(null);
    setBuildingName('');
    setShowBuildingDialog(false);
    toast.success("Building saved successfully");
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
          // If the 3D buildings service is available, add it
          L.tileLayer('https://tile.osmbuildings.org/0.2/dixw8kmb/tile/{z}/{x}/{y}.png', {
            attribution: '© OSM Buildings',
            maxZoom: 19
          }).addTo(map);
          
          console.log("OSM Buildings layer added successfully");
        } else {
          // Fallback to just showing building outlines
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

      {/* Building Save Dialog */}
      {showBuildingDialog && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-md shadow-lg z-[10000] w-80">
          <h3 className="text-lg font-semibold mb-4">Save Building</h3>
          <input
            type="text"
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            placeholder="Building Name"
            className="w-full p-2 border rounded-md mb-4"
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => {
                setShowBuildingDialog(false);
                setCurrentDrawing(null);
              }}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveBuilding}
              disabled={!buildingName.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
