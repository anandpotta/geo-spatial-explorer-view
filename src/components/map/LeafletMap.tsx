
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
  const cleanupInProgress = useRef<boolean>(false);
  
  // Generate a truly unique container ID that won't be reused
  const mapContainerId = useRef<string>(`map-container-${mapInstanceKey}-${Math.random().toString(36).substring(2, 9)}`);
  
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
    
    // Create a new container to avoid reuse issues
    return () => {
      cleanupInProgress.current = true;
      
      // If we have a map reference, clean it up properly
      if (mapRef.current) {
        try {
          console.log('Cleaning up Leaflet map instance');
          
          // First remove all event listeners
          mapRef.current.off();
          
          // Then remove all layers
          mapRef.current.eachLayer(layer => {
            try {
              mapRef.current?.removeLayer(layer);
            } catch (e) {
              console.warn('Error removing layer:', e);
            }
          });
          
          // Then remove the map itself if it has a container
          try {
            if (mapRef.current.getContainer()) {
              mapRef.current.remove();
            }
          } catch (e) {
            console.warn('Error removing map:', e);
          }
          
          // Clear the reference
          mapRef.current = null;
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
      }
      
      // Clean up the old container to prevent reuse
      const oldContainer = document.getElementById(mapContainerId.current);
      if (oldContainer) {
        // We'll replace it with a fresh one
        const parent = oldContainer.parentElement;
        if (parent) {
          try {
            parent.removeChild(oldContainer);
            
            const newContainer = document.createElement('div');
            newContainer.id = `map-container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            newContainer.style.width = '100%';
            newContainer.style.height = '100%';
            parent.appendChild(newContainer);
          } catch (e) {
            console.warn('Error replacing container:', e);
          }
        }
      }
      
      cleanupInProgress.current = false;
    };
  }, [mapInstanceKey]);
  
  // Handle map reference and initialization
  const handleSetMapRef = useCallback((map: L.Map) => {
    console.log('Map reference provided');
    
    // Don't set up the map if cleanup is in progress
    if (cleanupInProgress.current) {
      console.warn('Cleanup in progress, skipping map setup');
      return;
    }
    
    // Store the map reference
    mapRef.current = map;
    
    // Force invalidate size to ensure proper rendering
    setTimeout(() => {
      if (!mapRef.current || cleanupInProgress.current) return;
      
      try {
        if (mapRef.current.getContainer()) {
          // Perform multiple invalidations to ensure rendering
          mapRef.current.invalidateSize(true);
          
          // Set a small timeout for the second invalidation
          setTimeout(() => {
            if (!mapRef.current || cleanupInProgress.current) return;
            
            try {
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
              
              if (onMapReady && mapRef.current) {
                onMapReady(mapRef.current);
              }
            } catch (err) {
              console.error('Error initializing map:', err);
              
              if (mapReadyAttempts < 3) {
                setMapReadyAttempts(prev => prev + 1);
                // Try again with a delay
                setTimeout(() => {
                  if (mapRef.current && !cleanupInProgress.current) {
                    setIsMapInitialized(true);
                    if (onMapReady) onMapReady(mapRef.current);
                  }
                }, 500);
              }
            }
          }, 300);
        }
      } catch (err) {
        console.error('Error in map initialization:', err);
      }
    }, 200);
  }, [selectedLocation, onMapReady, mapReadyAttempts]);

  // Safe flyTo function with proper error handling
  const safeMapFlyTo = useCallback((lat: number, lng: number, zoom: number = 18) => {
    if (!mapRef.current || !isMapInitialized || cleanupInProgress.current) {
      console.error('Map not initialized for flyTo');
      return false;
    }
    
    try {
      // Check if the map is in a valid state for flying
      if (mapRef.current.getContainer()) {
        // First invalidate size to ensure proper rendering
        mapRef.current.invalidateSize(true);
        
        // Check if map has _leaflet_pos through a safe method
        let hasValidCenter = false;
        try {
          const center = mapRef.current.getCenter();
          hasValidCenter = true;
        } catch (e) {
          console.warn('Map center not available, deferring navigation');
          hasValidCenter = false;
        }
        
        if (hasValidCenter) {
          // Use a timeout to ensure the DOM is ready
          setTimeout(() => {
            if (!mapRef.current || cleanupInProgress.current) return;
            
            try {
              // Double check the map is still valid
              if (mapRef.current.getContainer()) {
                // Try flyTo for smooth animation
                mapRef.current.flyTo([lat, lng], zoom, {
                  animate: true,
                  duration: 1.5
                });
              }
            } catch (innerError) {
              console.error('Inner flyTo error:', innerError);
              // As a fallback, try setView which is more reliable
              try {
                if (mapRef.current && !cleanupInProgress.current) {
                  mapRef.current.setView([lat, lng], zoom);
                }
              } catch (setViewError) {
                console.error('setView fallback error:', setViewError);
              }
            }
          }, 200);
          
          return true;
        } else {
          // If we can't get the center, use setView directly
          setTimeout(() => {
            if (!mapRef.current || cleanupInProgress.current) return;
            
            try {
              if (mapRef.current.getContainer()) {
                mapRef.current.setView([lat, lng], zoom);
              }
            } catch (err) {
              console.error('Error in setView fallback:', err);
            }
          }, 200);
          
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Error in safeMapFlyTo:', err);
      return false;
    }
  }, [isMapInitialized]);

  // Handle location changes
  useEffect(() => {
    if (selectedLocation && mapRef.current && isMapInitialized && !cleanupInProgress.current) {
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
          
          // Generate new keys to force recreation
          const newKey = Date.now();
          setMapInstanceKey(newKey);
          mapContainerId.current = `map-container-${newKey}-${Math.random().toString(36).substring(2, 9)}`;
        }
      } catch (err) {
        console.error('Error flying to location:', err);
        // If there's an error, recreate the map
        const newKey = Date.now();
        setMapInstanceKey(newKey);
        mapContainerId.current = `map-container-${newKey}-${Math.random().toString(36).substring(2, 9)}`;
      }
    }
  }, [selectedLocation, isMapInitialized, safeMapFlyTo]);

  // Use mapEvents hook with safeguards
  useMapEvents(isMapInitialized ? mapRef.current : null, selectedLocation);

  const handleLocationSelect = useCallback((position: [number, number]) => {
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
    
    if (mapRef.current && isMapInitialized && !cleanupInProgress.current) {
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
  }, [isMapInitialized, safeMapFlyTo, onLocationSelect]);

  // Adding the handleClearAll function that was missing
  const handleClearAll = useCallback(() => {
    mapState.setTempMarker(null);
    mapState.setMarkerName('');
    mapState.setMarkerType('building');
    mapState.setCurrentDrawing(null);
    mapState.setShowFloorPlan(false);
    mapState.setSelectedDrawing(null);
    mapState.setActiveTool(null);
    
    if (mapRef.current && isMapInitialized && !cleanupInProgress.current) {
      try {
        mapRef.current.invalidateSize();
      } catch (err) {
        console.error('Error invalidating map size:', err);
      }
    }
  }, [mapState, isMapInitialized]);

  if (mapState.showFloorPlan) {
    return (
      <FloorPlanView 
        onBack={() => mapState.setShowFloorPlan(false)} 
        drawing={mapState.selectedDrawing}
      />
    );
  }

  // Reset the local mapInstanceKey to force rerender if needed
  const resetMap = () => {
    const newKey = Date.now();
    setMapInstanceKey(newKey);
    mapContainerId.current = `map-container-${newKey}-${Math.random().toString(36).substring(2, 9)}`;
    setIsMapInitialized(false);
    setMapReadyAttempts(0);
  };

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
