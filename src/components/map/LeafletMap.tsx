
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
  
  // Reset map instance when component unmounts or updates
  useEffect(() => {
    // Initialize Leaflet icons
    setupLeafletIcons();
    
    // Ensure CSS is loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        try {
          // Fix: Use proper type checking without accessing private properties
          if (mapRef.current && mapRef.current.remove) {
            // Check if the map is still valid before removing
            try {
              // Getting container will throw if map is already removed
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

  // Force a new map instance when selectedLocation changes - but do it properly
  useEffect(() => {
    if (selectedLocation) {
      // Instead of forcing a full re-render, just fly to the new location
      if (mapRef.current) {
        mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18);
      } else {
        // Generate a new key to force re-render of the map component only if map isn't initialized
        setMapInstanceKey(Date.now());
      }
    }
  }, [selectedLocation]);

  const handleSetMapRef = (map: L.Map) => {
    // Don't reassign map reference if one already exists
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    mapRef.current = map;
    
    if (onMapReady) {
      onMapReady(map);
    }
    
    if (selectedLocation) {
      map.flyTo([selectedLocation.y, selectedLocation.x], 18);
    }
    
    // Force map to recalculate size after initialization
    setTimeout(() => {
      if (mapRef.current && mapRef.current.getContainer()) {
        mapRef.current.invalidateSize(true);
      }
    }, 100);
  };

  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    if (mapRef.current) {
      mapRef.current.flyTo(position, 18, {
        duration: 2
      });
    }
  };

  // Handler for clearing all map state
  const handleClearAll = () => {
    // Reset any temporary state in mapState
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    
    // Force redraw of the map to clear any visual artifacts
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
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
