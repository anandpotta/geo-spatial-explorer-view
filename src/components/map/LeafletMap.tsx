
import { useEffect, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { useMapState } from '@/hooks/useMapState';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { getSavedMarkers } from '@/utils/marker-utils';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import { setupLeafletIcons } from './LeafletMapIcons';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
  onLocationSelect?: (location: Location) => void;
  onClearAll?: () => void;
  onClearSelectedLocation?: () => void;
}

// Extended interface for accessing internal Leaflet properties
interface LeafletMapInternal extends L.Map {
  _layers: { [key: string]: L.Layer };
}

const LeafletMap = ({ 
  selectedLocation, 
  onMapReady, 
  activeTool, 
  onLocationSelect, 
  onClearAll,
  onClearSelectedLocation 
}: LeafletMapProps) => {
  const [isMapReferenceSet, setIsMapReferenceSet] = useState(false);
  const [instanceKey, setInstanceKey] = useState<number>(Date.now());
  
  // Initialize Leaflet icons
  useEffect(() => {
    setupLeafletIcons();
  }, []);
  
  // Generate a unique instance ID for this component instance to avoid container reuse
  const uniqueInstanceId = useMemo(() => `leaflet-map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Custom hooks
  const mapState = useMapState(selectedLocation);
  const { 
    mapRef, 
    mapInstanceKey, 
    isMapReady, 
    handleSetMapRef,
    resetMapInstance 
  } = useMapInitialization(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);

  // Direct location selection handler that bypasses useLocationSelection
  const handleLocationSelect = useCallback((position: [number, number]) => {
    console.log("Direct location select in LeafletMap:", position);
    
    if (!mapRef.current) {
      console.warn("Map reference not available for navigation");
      toast.error("Map is not ready. Please try again.");
      return;
    }
    
    try {
      console.log("Flying to position:", position);
      mapRef.current.flyTo(position, 18, {
        animate: true,
        duration: 1.5
      });
      
      toast.success("Navigated to saved location");
    } catch (err) {
      console.error('Error during navigation:', err);
      toast.error("Navigation failed. Please try again.");
    }
  }, []);

  // Reset map if there are errors
  const forceReset = useCallback(() => {
    console.log("Forcing map reset");
    setInstanceKey(Date.now());
    resetMapInstance();
    setIsMapReferenceSet(false);
  }, [resetMapInstance]);

  // Handle markers updates
  useEffect(() => {
    const handleMarkersUpdated = () => {
      const savedMarkers = getSavedMarkers();
      mapState.setMarkers(savedMarkers);
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
    };
  }, [mapState]);

  // Handle selected location changes
  useEffect(() => {
    if (selectedLocation && mapRef.current && isMapReady && isMapReferenceSet) {
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
    }
  }, [selectedLocation, isMapReady, isMapReferenceSet]);

  // Custom map reference handler
  const handleMapRefWrapper = useCallback((map: L.Map) => {
    console.log('Map ref wrapper called');
    handleSetMapRef(map);
    setIsMapReferenceSet(true);
    
    // Only call parent onMapReady once when the map is first ready
    if (onMapReady && !isMapReferenceSet) {
      onMapReady(map);
    }
  }, [handleSetMapRef, onMapReady, isMapReferenceSet]);

  // Clear all layers and reset state (but preserve selected location)
  const handleClearAllWrapper = useCallback(() => {
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    
    if (onClearAll) {
      onClearAll();
    }
    
    // Clear all layers
    if (mapRef.current) {
      try {
        const mapInternal = mapRef.current as LeafletMapInternal;
        const layers = mapInternal._layers;
        if (layers) {
          Object.keys(layers).forEach(layerId => {
            const layer = layers[layerId];
            if (layer && (layer as any).options && ((layer as any).options.isDrawn || (layer as any).options.id)) {
              mapRef.current?.removeLayer(layer);
            }
          });
        }
      } catch (err) {
        console.error('Error during clear all operation:', err);
      }
    }
  }, [mapState, onClearAll]);

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
      key={`map-view-${uniqueInstanceId}-${mapInstanceKey}-${instanceKey}`}
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
      selectedLocation={selectedLocation}
      onClearSelectedLocation={onClearSelectedLocation}
    />
  );
};

export default LeafletMap;
