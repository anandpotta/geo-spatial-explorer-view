
import { useRef, useEffect, useState, useCallback } from 'react';
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

  // Cleanup function to properly remove the map instance
  const cleanupMap = useCallback(() => {
    if (mapRef.current) {
      console.log('Cleaning up Leaflet map instance');
      try {
        // Check if the map still has a valid container before removing
        try {
          const container = mapRef.current.getContainer();
          if (container && container.parentNode) {
            mapRef.current.remove();
            // Also remove any leaflet-related classes from the container
            container.classList.remove('leaflet-container-reused');
          }
        } catch (e) {
          console.log('Map container already removed');
        }
      } catch (err) {
        console.error('Error cleaning up map:', err);
      }
      mapRef.current = null;
    }
  }, []);
  
  // Setup and cleanup of Leaflet
  useEffect(() => {
    console.log('Setting up Leaflet icons and CSS');
    setupLeafletIcons();
    
    // Force Leaflet CSS to be loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      console.log('Adding Leaflet CSS');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Also ensure Leaflet Draw CSS is loaded
    if (!document.querySelector('link[href*="leaflet.draw.css"]')) {
      console.log('Adding Leaflet Draw CSS');
      const drawLink = document.createElement('link');
      drawLink.rel = 'stylesheet';
      drawLink.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
      document.head.appendChild(drawLink);
    }
    
    // Cleanup on unmount
    return cleanupMap;
  }, [cleanupMap, mapInstanceKey]);

  // Handle location changes
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      try {
        // Only try to fly if the map is properly initialized
        if (mapRef.current.getContainer()) {
          console.log('Flying to selected location:', selectedLocation);
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18);
            }
          }, 100);
        }
      } catch (err) {
        console.error('Error flying to location:', err);
        // If there's an error, recreate the map
        cleanupMap();
        setMapInstanceKey(Date.now());
      }
    }
  }, [selectedLocation, cleanupMap]);

  // Handler for when the map is ready
  const handleSetMapRef = useCallback((map: L.Map) => {
    console.log('Map reference provided');
    
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    try {
      // Verify map is properly initialized
      if (map && map.getContainer()) {
        console.log('Map container verified, storing reference');
        mapRef.current = map;
        
        // Force resize to ensure proper dimensions
        map.invalidateSize(true);
        
        // Fly to location after a short delay to ensure the map is ready
        if (selectedLocation) {
          console.log('Flying to initial location');
          setTimeout(() => {
            try {
              if (mapRef.current && mapRef.current.getContainer()) {
                mapRef.current.invalidateSize(true);
                mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18);
              }
            } catch (err) {
              console.error('Error flying to location after delay:', err);
            }
          }, 500);
        }
        
        // Call onMapReady callback if provided
        if (onMapReady) {
          setTimeout(() => {
            try {
              if (mapRef.current) {
                onMapReady(mapRef.current);
              }
            } catch (err) {
              console.error('Error in onMapReady callback:', err);
            }
          }, 300);
        }
      }
    } catch (err) {
      console.error('Error setting map reference:', err);
    }
  }, [selectedLocation, onMapReady]);

  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    if (mapRef.current) {
      try {
        mapRef.current.flyTo(position, 18, {
          duration: 2
        });
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  };

  const handleClearAll = () => {
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    
    if (mapRef.current) {
      try {
        mapRef.current.invalidateSize();
      } catch (err) {
        console.error('Error invalidating map size:', err);
      }
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
    <div className="h-full w-full">
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
        activeTool={activeTool || mapState.activeTool}
        onRegionClick={mapState.handleRegionClick}
        onClearAll={handleClearAll}
      />
    </div>
  );
};

export default LeafletMap;
