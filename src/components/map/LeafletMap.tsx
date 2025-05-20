import { useEffect, useState } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { useMapState } from '@/hooks/useMapState';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useLocationSelection } from '@/hooks/useLocationSelection';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { getSavedMarkers } from '@/utils/marker-utils';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import { setupLeafletIcons } from './LeafletMapIcons';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
  onLocationSelect?: (location: Location) => void;
  onClearAll?: () => void;
  stayAtCurrentPosition?: boolean;
}

const LeafletMap = ({ 
  selectedLocation, 
  onMapReady, 
  activeTool, 
  onLocationSelect, 
  onClearAll,
  stayAtCurrentPosition = false
}: LeafletMapProps) => {
  const [isMapReferenceSet, setIsMapReferenceSet] = useState(false);
  const [isMarkerActive, setIsMarkerActive] = useState(false);
  
  // Initialize Leaflet icons
  useEffect(() => {
    setupLeafletIcons();
  }, []);
  
  // Custom hooks
  const mapState = useMapState(selectedLocation);
  const { 
    mapRef, 
    mapInstanceKey, 
    isMapReady, 
    handleSetMapRef 
  } = useMapInitialization(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  const { handleLocationSelect, handleClearAll } = useLocationSelection(mapRef, isMapReady, onLocationSelect);

  // Sync the stayAtCurrentPosition state with our component props and handle marker events
  useEffect(() => {
    mapState.setStayAtCurrentPosition(stayAtCurrentPosition || isMarkerActive);
    
    const handleMarkerPlaced = () => {
      console.log("Marker placed event detected");
      setIsMarkerActive(true);
      mapState.setStayAtCurrentPosition(true);
    };
    
    const handleMarkerSaved = () => {
      console.log("Marker saved event detected");
      // Keep the flag active for a short while to prevent jumping
      setTimeout(() => {
        setIsMarkerActive(false);
      }, 500);
    };
    
    const handleDrawingStart = () => {
      console.log("Drawing start event detected");
      setIsMarkerActive(true);
      mapState.setStayAtCurrentPosition(true);
    };
    
    const handleDrawingEnd = () => {
      console.log("Drawing end event detected");
      // Keep the flag active for a short while to prevent jumping
      setTimeout(() => {
        setIsMarkerActive(false);
      }, 500);
    };
    
    window.addEventListener('markerPlaced', handleMarkerPlaced);
    window.addEventListener('markerSaved', handleMarkerSaved);
    window.addEventListener('drawingStart', handleDrawingStart);
    window.addEventListener('drawingEnd', handleDrawingEnd);
    
    // Listen for clear all events
    const handleClearAllEvent = () => {
      console.log("Clear all event detected");
      mapState.setTempMarker(null);
      mapState.setMarkerName('');
      mapState.setMarkerType('building');
      mapState.setCurrentDrawing(null);
      mapState.setShowFloorPlan(false);
      mapState.setSelectedDrawing(null);
    };
    
    window.addEventListener('clearAllDrawings', handleClearAllEvent);
    
    return () => {
      window.removeEventListener('markerPlaced', handleMarkerPlaced);
      window.removeEventListener('markerSaved', handleMarkerSaved);
      window.removeEventListener('drawingStart', handleDrawingStart);
      window.removeEventListener('drawingEnd', handleDrawingEnd);
      window.removeEventListener('clearAllDrawings', handleClearAllEvent);
    };
  }, [stayAtCurrentPosition, mapState]);

  // Handle markers updates
  useEffect(() => {
    const handleMarkersUpdated = () => {
      const savedMarkers = getSavedMarkers();
      mapState.setMarkers(savedMarkers);
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    window.addEventListener('clearAllDrawings', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
      window.removeEventListener('clearAllDrawings', handleMarkersUpdated);
    };
  }, []);

  // Handle selected location changes with improved position check
  useEffect(() => {
    if (selectedLocation && mapRef.current && isMapReady && isMapReferenceSet) {
      // Only fly to the selected location if not staying at current position
      // and not currently placing a marker or drawing
      if (!mapState.stayAtCurrentPosition && !isMarkerActive) {
        try {
          const container = mapRef.current.getContainer();
          if (container && document.body.contains(container)) {
            console.log('Flying to selected location:', selectedLocation);
            mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
              animate: true,
              duration: 1.5
            });
          }
        } catch (err) {
          console.error('Error flying to location:', err);
        }
      } else {
        console.log('Staying at current position, not flying to selected location');
      }
    }
  }, [selectedLocation, isMapReady, isMapReferenceSet, mapState.stayAtCurrentPosition, isMarkerActive]);

  // Custom map reference handler that sets our local state
  const handleMapRefWrapper = (map: L.Map) => {
    handleSetMapRef(map);
    setIsMapReferenceSet(true);
    
    // Store the feature group reference globally
    if (map) {
      // Find feature group in the map
      Object.values(map._layers || {}).forEach(layer => {
        if (layer instanceof L.FeatureGroup) {
          window.featureGroup = layer;
        }
      });
    }
    
    // Only call parent onMapReady once when the map is first ready
    if (onMapReady && !isMapReferenceSet) {
      onMapReady(map);
    }
  };

  // Clear all layers and reset state
  const handleClearAllWrapper = () => {
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    
    if (onClearAll) {
      onClearAll();
    }
    
    // Dispatch a clear all event
    window.dispatchEvent(new Event('clearAllDrawings'));
    window.dispatchEvent(new Event('clearAllSvgPaths'));
    
    handleClearAll();
  };

  if (mapState.showFloorPlan) {
    return (
      <FloorPlanView 
        onBack={() => mapState.setShowFloorPlan(false)} 
        drawing={mapState.selectedDrawing}
      />
    );
  }

  return (
    <MapView
      key={`map-view-${mapInstanceKey}`}
      position={mapState.position}
      zoom={mapState.zoom}
      markers={mapState.markers}
      tempMarker={mapState.tempMarker}
      markerName={mapState.markerName}
      markerType={mapState.markerType}
      onMapReady={handleMapRefWrapper}
      onLocationSelect={handleLocationSelect}
      onMapClick={handleMapClick}
      onDeleteMarker={mapState.handleDeleteMarker}
      onSaveMarker={mapState.handleSaveMarker}
      setMarkerName={mapState.setMarkerName}
      setMarkerType={mapState.setMarkerType}
      onShapeCreated={handleShapeCreated}
      activeTool={activeTool || mapState.activeTool}
      onRegionClick={mapState.handleRegionClick}
      onClearAll={handleClearAllWrapper}
      isMapReady={isMapReady}
    />
  );
};

export default LeafletMap;

// Add feature group to global window object
declare global {
  interface Window {
    featureGroup?: L.FeatureGroup;
  }
}
