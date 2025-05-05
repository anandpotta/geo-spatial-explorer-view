
import { useState, useRef, useCallback, useEffect } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { toast } from 'sonner';

interface UseLeafletMapInitializationProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
}

export const useLeafletMapInitialization = ({
  selectedLocation,
  onMapReady
}: UseLeafletMapInitializationProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapInstanceKey, setMapInstanceKey] = useState<string>(`map-instance-${Date.now()}`);
  const containerIdRef = useRef<string>(`map-container-${Date.now()}`);
  
  // Map reference initialization function with proper cleanup
  const handleSetMapRef = useCallback((map: L.Map) => {
    // Store container ID for tracking
    const containerId = map.getContainer()?.id;
    console.log('Map reference provided, container ID:', containerId);
    
    // Store the map reference
    mapRef.current = map;
    
    setTimeout(() => {
      if (mapRef.current) {
        try {
          // Only invalidate size if the map still exists
          mapRef.current.invalidateSize(true);
          setIsMapReady(true);
          
          if (selectedLocation) {
            mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
              animate: true,
              duration: 1.5
            });
          }
          
          if (onMapReady) {
            onMapReady(map);
          }
        } catch (err) {
          console.warn('Error initializing map:', err);
        }
      }
    }, 300);
  }, [selectedLocation, onMapReady]);
  
  // Handle selectedLocation changes
  useEffect(() => {
    if (selectedLocation && mapRef.current && isMapReady) {
      try {
        console.log('Flying to selected location:', selectedLocation);
        mapRef.current.flyTo([selectedLocation.y, selectedLocation.x], 18, {
          animate: true,
          duration: 1.5
        });
      } catch (err) {
        console.error('Error flying to location:', err);
        forceMapRemount();
      }
    }
  }, [selectedLocation, isMapReady]);
  
  // Force map remount when needed
  const forceMapRemount = useCallback(() => {
    // Generate new keys for container and instance
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    
    // Clear the map reference first
    mapRef.current = null;
    
    // Set new unique keys
    containerIdRef.current = `map-container-${timestamp}-${randomSuffix}`;
    setMapInstanceKey(`map-instance-${timestamp}-${randomSuffix}`);
    setIsMapReady(false);
    
    console.log('Forced map remount with new key:', containerIdRef.current);
  }, []);
  
  // Handle location selection
  const handleLocationSelect = useCallback((position: [number, number]) => {
    console.log("Location selected in useLeafletMapInitialization:", position);
    if (!mapRef.current || !isMapReady) {
      console.warn("Map is not ready yet, cannot navigate");
      toast.error("Map is not fully loaded yet. Please try again in a moment.");
      return;
    }
    
    try {
      mapRef.current.flyTo(position, 18, {
        animate: true,
        duration: 1.5
      });
      
      return {
        id: `loc-${position[0]}-${position[1]}`,
        label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
        x: position[1],
        y: position[0]
      } as Location;
    } catch (err) {
      console.error('Error flying to location:', err);
      toast.error("Could not navigate to location. Please try again.");
      return null;
    }
  }, [isMapReady]);
  
  // Return proper cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      setIsMapReady(false);
      mapRef.current = null;
    };
  }, []);
  
  return {
    mapRef,
    isMapReady,
    mapInstanceKey,
    containerId: containerIdRef.current,
    handleSetMapRef,
    handleLocationSelect,
    forceMapRemount
  };
};
