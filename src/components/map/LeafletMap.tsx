
import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { setupLeafletIcons } from './LeafletMapIcons';
import { useMapState } from '@/hooks/useMapState';
import { useMapEvents } from '@/hooks/useMapEvents';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { getSavedMarkers } from '@/utils/marker-utils';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
  onLocationSelect?: (location: Location) => void;
}

const LeafletMap = ({ selectedLocation, onMapReady, activeTool, onLocationSelect }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const loadedMarkersRef = useRef(false);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const mapContainerIdRef = useRef<string>(`map-container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  
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
    
    // Load saved markers from storage
    const savedMarkers = getSavedMarkers();
    mapState.setMarkers(savedMarkers);
    
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        try {
          // Important: Remove all layers first before removing the map
          mapRef.current.eachLayer((layer) => {
            mapRef.current?.removeLayer(layer);
          });
          
          // Then properly remove the map
          mapRef.current.remove();
          mapRef.current = null;
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
      }
    };
  }, [mapInstanceKey]);

  // Listen for marker updates
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
  }, []);

  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      try {
        // Only try to fly if the map is properly initialized
        if (mapRef.current.getContainer()) {
          console.log('Flying to selected location:', selectedLocation);
          // Use flyTo with animation for smooth transition
          mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
            animate: true,
            duration: 1.5 // seconds
          });
        }
      } catch (err) {
        console.error('Error flying to location:', err);
        // If there's an error, recreate the map with a new ID
        setMapInstanceKey(Date.now());
        mapContainerIdRef.current = `map-container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
    }
  }, [selectedLocation]);

  const handleSetMapRef = (map: L.Map) => {
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
        
        // Force invalidate size to ensure proper rendering
        map.invalidateSize(true);
        
        // Only fly to location if we have one and the map is ready
        if (selectedLocation) {
          console.log('Flying to initial location');
          setTimeout(() => {
            // Check map exists and has a container before flying
            if (map && map.getContainer && typeof map.getContainer === 'function') {
              try {
                map.flyTo([selectedLocation.y, selectedLocation.x], 18, {
                  animate: true,
                  duration: 1.5
                });
              } catch (err) {
                console.error('Error during initial flyTo:', err);
              }
            }
          }, 200);
        }
        
        if (onMapReady) {
          onMapReady(map);
        }
      }
    } catch (err) {
      console.error('Error setting map reference:', err);
    }
  };

  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    if (mapRef.current) {
      try {
        // Use flyTo with animation for smooth transition
        mapRef.current.flyTo(position, 18, {
          animate: true,
          duration: 1.5 // seconds
        });
        
        // If we have an onLocationSelect callback, create a Location object and pass it up
        if (onLocationSelect) {
          const location: Location = {
            id: `loc-${position[0]}-${position[1]}`,
            label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
            x: position[1],
            y: position[0]
          };
          onLocationSelect(location);
        }
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
    <MapView
      key={`map-view-${mapInstanceKey}`}
      containerId={mapContainerIdRef.current}
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
  );
};

export default LeafletMap;

