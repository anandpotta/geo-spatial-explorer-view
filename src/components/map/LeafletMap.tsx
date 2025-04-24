
import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { setupLeafletIcons } from './LeafletMapIcons';
import { useMapState } from '@/hooks/useMapState';
import { useMapEvents } from '@/hooks/useMapEvents';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
}

const LeafletMap = ({ selectedLocation, onMapReady, activeTool }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const loadedMarkersRef = useRef(false);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  
  const mapState = useMapState(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  
  useEffect(() => {
    setupLeafletIcons();
    
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        try {
          if (mapRef.current && mapRef.current.remove) {
            try {
              mapRef.current.getContainer();
              mapRef.current.remove();
            } catch (e) {
              console.log('Map already removed');
            }
          }
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        mapRef.current = null;
      }
    };
  }, [mapInstanceKey]);

  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      try {
        // Make sure the map is valid before attempting to fly to a location
        if (mapRef.current.getContainer()) {
          mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18);
        }
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  }, [selectedLocation]);

  const handleSetMapRef = (map: L.Map) => {
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    mapRef.current = map;
    
    if (onMapReady) {
      onMapReady(map);
    }
    
    // Ensure the map is fully initialized before trying any operations
    setTimeout(() => {
      try {
        if (mapRef.current && selectedLocation && mapRef.current.getContainer()) {
          mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18);
        }
      } catch (err) {
        console.error('Error flying to location after map ready:', err);
      }
      
      // Make sure the map is invalidated to handle any sizing issues
      if (mapRef.current && mapRef.current.getContainer()) {
        mapRef.current.invalidateSize(true);
      }
    }, 500); // Increased from 100ms to 500ms
  };

  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    try {
      if (mapRef.current && mapRef.current.getContainer()) {
        mapRef.current.flyTo(position, 18, {
          duration: 2
        });
      }
    } catch (err) {
      console.error('Error flying to selected location:', err);
    }
  };

  const handleClearAll = () => {
    console.log("Handling clear all in LeafletMap");
    
    // Reset all map state
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    
    // Force map to refresh
    try {
      if (mapRef.current && mapRef.current.getContainer()) {
        mapRef.current.invalidateSize();
      }
    } catch (err) {
      console.error('Error invalidating map size:', err);
    }
    
    // Force reload the map instance to clear all layers
    setTimeout(() => {
      setMapInstanceKey(Date.now());
    }, 100);
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
      onMapReady={handleSetMapRef}
      onLocationSelect={handleLocationSelect}
      onMapClick={handleMapClick}
      onDeleteMarker={mapState.handleDeleteMarker}
      onSaveMarker={mapState.handleSaveMarker}
      setMarkerName={mapState.setMarkerName}
      setMarkerType={mapState.setMarkerType}
      onShapeCreated={handleShapeCreated}
      activeTool={activeTool || null}
      onRegionClick={mapState.handleRegionClick}
      onClearAll={handleClearAll}
    />
  );
};

export default LeafletMap;
