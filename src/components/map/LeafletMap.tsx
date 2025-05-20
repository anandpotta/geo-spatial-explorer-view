
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { EditControl } from "./LeafletCompatibilityLayer";
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawingTools } from '@/hooks/useDrawingTools';
import { useLayerUpdates } from '@/hooks/useLayerUpdates';
import { useLayerReferences } from '@/hooks/useLayerReferences';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useMarkers } from '@/hooks/useMarkers';
import MarkersContainer from './marker/MarkersContainer';
import { LocationMarker } from '@/utils/marker-utils';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useDrawingFileUpload } from '@/hooks/useDrawingFileUpload';
import { ExtendedLayer, LeafletMapInternal } from '@/utils/leaflet-type-utils';
import { getSavedDrawings } from '@/services/drawing-service';
import { getSavedMarkers } from '@/utils/marker-utils';
import { toast } from 'sonner';
import FloorPlanView from './FloorPlanView';
import LayerManager from './drawing/LayerManager';

// Import leaflet CSS directly
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface LeafletMapProps {
  selectedLocation?: { x: number, y: number, label?: string };
  onMapReady: (map: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  stayAtCurrentPosition?: boolean;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  selectedLocation,
  onMapReady,
  activeTool,
  onClearAll,
  stayAtCurrentPosition = false
}) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState<string>('');
  const [isMarkerActive, setIsMarkerActive] = useState<boolean>(false);
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('pin');
  const [showFloorPlanView, setShowFloorPlanView] = useState<boolean>(false);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingData | null>(null);
  
  // Initialize the map and its state using custom hook
  const {
    mapRef,
    mapInstanceKey,
    isMapReady,
    setIsMapReady,
    setMapInstanceKey,
    handleSetMapRef,
  } = useMapInitialization(selectedLocation);
  
  // Use custom hook for handling file uploads
  const { handleUploadToDrawing } = useDrawingFileUpload();
  
  // Use custom hook for managing markers
  const {
    handleMapClick,
    handleMarkerDragEnd,
    handleSaveMarker,
    handleDeleteMarker
  } = useMarkers(mapRef, setMarkers, setTempMarker, setIsMarkerActive, setMapInstanceKey);
  
  // Load drawings and markers from localStorage
  useEffect(() => {
    const savedDrawings = getSavedDrawings();
    setDrawings(savedDrawings);
    
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
  }, []);
  
  // Event handlers using leaflet hook
  const MapEventsComponent = () => {
    useMapEvents({
      click: (e) => {
        if (isMarkerActive && tempMarker === null) {
          handleMapClick(e);
        }
      }
    });
    return null;
  };
  
  // Function to handle marker creation
  const handleCreateMarker = () => {
    setIsMarkerActive(true);
    window.dispatchEvent(new CustomEvent('markerPlaced'));
  };
  
  // Function to handle marker save
  const handleMarkerSaved = () => {
    if (tempMarker) {
      handleSaveMarker(tempMarker, markerName, markerType);
      setIsMarkerActive(false);
      setTempMarker(null);
      setMarkerName('');
      setMarkerType('pin');
      window.dispatchEvent(new CustomEvent('markerSaved'));
    }
  };
  
  // Function to handle marker delete
  const handleDeleteExistingMarker = (id: string) => {
    handleDeleteMarker(id);
  };
  
  // Handler for drawing creation
  const handleCreated = (e: any) => {
    const layer = e.layer;
    const drawingId = Date.now().toString();
    layer.options.id = drawingId;
    layer.options.isDrawn = true;
    
    // Extract geoJSON data
    const geoJSON = layer.toGeoJSON();
    geoJSON.properties = {
      name: 'New Drawing',
      description: '',
      style: {
        color: '#ff0000'
      }
    };
    
    // Add the new drawing to the state
    setDrawings(prevDrawings => {
      const newDrawings = [
        ...prevDrawings,
        {
          id: drawingId,
          geoJSON: geoJSON,
          properties: geoJSON.properties,
          type: geoJSON.geometry.type,
          coordinates: geoJSON.geometry.coordinates,
          userId: 'test-user'
        }
      ];
      
      localStorage.setItem('drawings', JSON.stringify(newDrawings));
      return newDrawings;
    });
  };
  
  // Handler for region click
  const handleRegionClick = (drawing: DrawingData) => {
    console.log(`Region clicked: ${drawing.id}`);
    setSelectedDrawing(drawing);
    setShowFloorPlanView(true);
  };
  
  // Handler for remove shape
  const handleRemoveShape = (drawingId: string) => {
    setDrawings(prevDrawings => {
      const updatedDrawings = prevDrawings.filter(drawing => drawing.id !== drawingId);
      localStorage.setItem('drawings', JSON.stringify(updatedDrawings));
      return updatedDrawings;
    });
  };
  
  // Handler for upload request
  const handleUploadRequest = (drawingId: string) => {
    console.log(`Upload requested for drawing ID: ${drawingId}`);
  };
  
  // Handler for clear all
  const handleClearAll = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    setDrawings([]);
    localStorage.removeItem('drawings');
    if (onClearAll) {
      onClearAll();
    }
  };
  
  // Set up the feature group
  useEffect(() => {
    if (mapRef.current) {
      // Initialize FeatureGroup
      featureGroupRef.current = new L.FeatureGroup();
      featureGroupRef.current.addTo(mapRef.current);
    }
  }, [mapRef.current]);
  
  // Update the useEffect block that watches for selectedLocation changes:
  useEffect(() => {
    if (
      mapRef.current && 
      selectedLocation && 
      !tempMarker && 
      !isMarkerActive && 
      !stayAtCurrentPosition // Don't navigate when stayAtCurrentPosition is true
    ) {
      // Use optional chaining to safely access the label property
      console.log(`Flying to selected location: ${selectedLocation.label || 'Unknown location'}`);
      try {
        mapRef.current.flyTo(
          [selectedLocation.y, selectedLocation.x],
          18,
          { animate: true, duration: 1.5 }
        );
      } catch (err) {
        console.error('Error during map flyTo operation:', err);
      }
    }
  }, [selectedLocation, tempMarker, isMarkerActive, stayAtCurrentPosition]);
  
  // Building coordinates display
  const [currentCoords, setCurrentCoords] = useState<{ lat: number, lng: number } | null>(null);
  
  // Map events for coordinate display
  const CoordinateTracker = () => {
    useMapEvents({
      mousemove: (e) => {
        setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
      mouseout: () => {
        setCurrentCoords(null);
      }
    });
    return null;
  };
  
  return (
    <div className="w-full h-full relative">
      {showFloorPlanView && selectedDrawing ? (
        <FloorPlanView
          onBack={() => setShowFloorPlanView(false)}
          drawing={selectedDrawing}
        />
      ) : (
        <div className="w-full h-full">
          <MapContainer
            center={selectedLocation ? [selectedLocation.y, selectedLocation.x] : [0, 0]}
            zoom={2}
            key={mapInstanceKey.toString()}
            ref={handleSetMapRef}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Coordinate display */}
            {currentCoords && (
              <div className="absolute bottom-8 left-8 bg-white/80 backdrop-blur-sm p-2 rounded-md shadow-md z-50">
                <p className="text-sm font-mono">
                  {`Lat: ${currentCoords.lat.toFixed(6)} | Lng: ${currentCoords.lng.toFixed(6)}`}
                </p>
              </div>
            )}
            
            <div className="leaflet-top leaflet-left">
              <div className="leaflet-control-zoom leaflet-bar">
                <a className="leaflet-control-zoom-in" href="#" title="Zoom in" role="button" aria-label="Zoom in">+</a>
                <a className="leaflet-control-zoom-out" href="#" title="Zoom out" role="button" aria-label="Zoom out">−</a>
              </div>
            </div>
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <LayerManager
              featureGroup={featureGroupRef.current!}
              savedDrawings={drawings}
              activeTool={activeTool}
              onRegionClick={handleRegionClick}
              onRemoveShape={handleRemoveShape}
              onUploadRequest={handleUploadRequest}
            />
            
            <MarkersContainer
              markers={markers}
              tempMarker={tempMarker}
              markerName={markerName}
              markerType={markerType}
              onDeleteMarker={handleDeleteExistingMarker}
              onSaveMarker={handleMarkerSaved}
              setMarkerName={setMarkerName}
              setMarkerType={setMarkerType}
            />
            
            <MapEventsComponent />
            <CoordinateTracker />
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
