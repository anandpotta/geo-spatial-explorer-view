
import { useRef, useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { setupLeafletIcons } from './LeafletMapIcons';
import { useMapState } from '@/hooks/useMapState';
import { useMapEvents } from '@/hooks/useMapEvents';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { toast } from 'sonner';
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
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [mapReadyAttempts, setMapReadyAttempts] = useState<number>(0);
  
  // Generate a truly unique container ID that won't be reused
  const mapContainerId = useRef<string>(`map-container-${mapInstanceKey}`);
  
  const mapState = useMapState(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  
  // Set up icons and CSS on mount
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
    
    // Force recreation of container on key change
    return () => {
      // Clean up the old container to prevent reuse
      const oldContainer = document.getElementById(mapContainerId.current);
      if (oldContainer) {
        // We'll replace it with a fresh one
        const parent = oldContainer.parentElement;
        if (parent) {
          const newContainer = document.createElement('div');
          newContainer.id = mapContainerId.current;
          newContainer.style.width = '100%';
          newContainer.style.height = '100%';
          parent.replaceChild(newContainer, oldContainer);
        }
      }
    };
  }, [mapInstanceKey]);
  
  // Clean up map on unmount or key change
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        try {
          // First remove all layers and handlers to ensure proper cleanup
          mapRef.current.eachLayer(layer => {
            mapRef.current?.removeLayer(layer);
          });
          mapRef.current.remove();
          mapRef.current = null;
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
      }
    };
  }, [mapInstanceKey]);

  // Safe flyTo function with proper error handling
  const safeMapFlyTo = (lat: number, lng: number, zoom: number = 18) => {
    if (!mapRef.current || !isMapInitialized) {
      console.error('Map not initialized for flyTo');
      return false;
    }
    
    try {
      // Check if the map is in a valid state for flying
      if (mapRef.current.getContainer()) {
        const center = mapRef.current.getCenter();
        
        // First invalidate size to ensure proper rendering
        mapRef.current.invalidateSize(true);
        
        // Use a timeout to ensure the DOM is ready
        setTimeout(() => {
          try {
            // Double check the map is still valid
            if (mapRef.current && mapRef.current.getContainer()) {
              mapRef.current.flyTo([lat, lng], zoom, {
                animate: true,
                duration: 1.5
              });
            }
          } catch (innerError) {
            console.error('Inner flyTo error:', innerError);
            // As a fallback, try setView which is more reliable
            try {
              mapRef.current?.setView([lat, lng], zoom);
            } catch (setViewError) {
              console.error('setView fallback error:', setViewError);
            }
          }
        }, 100);
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error in safeMapFlyTo:', err);
      return false;
    }
  };

  // Handle location changes
  useEffect(() => {
    if (selectedLocation && mapRef.current && isMapInitialized) {
      try {
        const lat = selectedLocation.y;
        const lng = selectedLocation.x;
        
        // Validate coordinates before flying
        if (isNaN(lat) || isNaN(lng)) {
          console.error('Invalid coordinates:', { lat, lng });
          toast.error('Invalid location coordinates');
          return;
        }
        
        console.log('Flying to location:', { lat, lng });
        
        // Use our safe fly function
        if (!safeMapFlyTo(lat, lng, 18)) {
          console.warn('Safe flyTo failed, recreating map');
          setMapInstanceKey(Date.now());
          mapContainerId.current = `map-container-${Date.now()}`;
        }
      } catch (err) {
        console.error('Error flying to location:', err);
        // If there's an error, recreate the map
        setMapInstanceKey(Date.now());
        mapContainerId.current = `map-container-${Date.now()}`;
      }
    }
  }, [selectedLocation, isMapInitialized]);

  const handleSetMapRef = useCallback((map: L.Map) => {
    console.log('Map reference provided');
    
    // Store the map reference
    mapRef.current = map;
    
    // Force invalidate size to ensure proper rendering
    setTimeout(() => {
      if (mapRef.current && mapRef.current.getContainer()) {
        try {
          // Perform multiple invalidations to ensure rendering
          mapRef.current.invalidateSize(true);
          
          // Set a small timeout for the second invalidation
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize(true);
              setIsMapInitialized(true);
              
              // Only fly to location if we have one and the map is ready
              if (selectedLocation) {
                const lat = selectedLocation.y;
                const lng = selectedLocation.x;
                
                // Validate coordinates before flying
                if (!isNaN(lat) && !isNaN(lng)) {
                  console.log('Flying to initial location');
                  safeMapFlyTo(lat, lng, 18);
                }
              }
              
              if (onMapReady) {
                onMapReady(map);
              }
            }
          }, 300);
        } catch (err) {
          console.error('Error initializing map:', err);
          if (mapReadyAttempts < 3) {
            setMapReadyAttempts(prev => prev + 1);
            // Try again with a delay
            setTimeout(() => {
              if (mapRef.current) {
                setIsMapInitialized(true);
                if (onMapReady) onMapReady(map);
              }
            }, 500);
          }
        }
      }
    }, 200);
  }, [selectedLocation, onMapReady, mapReadyAttempts]);

  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    
    if (!position || !Array.isArray(position) || position.length < 2) {
      console.error("Invalid position:", position);
      return;
    }
    
    const [lat, lng] = position;
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates:', { lat, lng });
      toast.error('Invalid location coordinates');
      return;
    }
    
    if (mapRef.current && isMapInitialized) {
      try {
        // Use our safe fly function
        safeMapFlyTo(lat, lng);
        
        // If we have an onLocationSelect callback, create a Location object and pass it up
        if (onLocationSelect) {
          const location: Location = {
            id: `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
            label: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            x: lng,
            y: lat
          };
          onLocationSelect(location);
        }
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  };

  // Adding the handleClearAll function that was missing
  const handleClearAll = () => {
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    
    if (mapRef.current && isMapInitialized) {
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
      mapContainerId={mapContainerId.current}
    />
  );
};

export default LeafletMap;
