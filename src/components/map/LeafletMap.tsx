
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
    
    // Clean up function to properly destroy the map instance
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        
        // Properly remove the map to prevent container reuse errors
        try {
          // Only try to remove if the map container still exists
          if (mapRef.current && mapRef.current.remove) {
            try {
              // First check if container exists and is attached to DOM
              const container = mapRef.current.getContainer();
              if (container && document.body.contains(container)) {
                console.log('Map container exists and is attached - removing map instance');
                mapRef.current.remove();
              }
            } catch (e) {
              console.log('Map container already detached or removed');
            }
          }
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        
        // Ensure the reference is cleared
        mapRef.current = null;
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
        const container = mapRef.current.getContainer();
        if (container && document.body.contains(container)) {
          console.log('Flying to selected location:', selectedLocation);
          // Use flyTo with animation for smooth transition
          mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
            animate: true,
            duration: 1.5 // seconds
          });
        }
      } catch (err) {
        console.error('Error flying to location:', err);
        // If there's an error, recreate the map with a new key
        setMapInstanceKey(Date.now());
      }
    }
  }, [selectedLocation]);

  const handleSetMapRef = (map: L.Map) => {
    console.log('Map reference provided');
    
    // Check if we already have a valid reference
    if (mapRef.current) {
      console.log('Map reference already exists, skipping assignment');
      return;
    }
    
    try {
      // Store reference only if container exists and is attached
      const container = map.getContainer();
      if (container && document.body.contains(container)) {
        console.log('Map container verified, storing reference');
        mapRef.current = map;
        
        // Force invalidate size to ensure proper rendering
        setTimeout(() => {
          if (mapRef.current) {
            try {
              mapRef.current.invalidateSize(true);
            } catch (err) {
              console.warn('Error invalidating map size:', err);
            }
          }
        }, 100);
        
        // Only fly to location if we have one and the map is ready
        if (selectedLocation) {
          console.log('Flying to initial location');
          setTimeout(() => {
            if (mapRef.current) {
              try {
                const container = mapRef.current.getContainer();
                if (container && document.body.contains(container)) {
                  mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
                    animate: true,
                    duration: 1.5
                  });
                }
              } catch (err) {
                console.warn('Error flying to initial location:', err);
              }
            }
          }, 200);
        }
        
        // Call onMapReady callback
        if (onMapReady) {
          onMapReady(map);
        }
      } else {
        console.warn('Map container not verified, skipping reference assignment');
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
