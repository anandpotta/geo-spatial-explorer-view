
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
  const [mapInstanceKey, setMapInstanceKey] = useState<string>(`map-container-${Date.now()}`);
  const containerRefHistory = useRef<Set<string>>(new Set());
  
  // Map reference initialization function with proper cleanup
  const handleSetMapRef = useCallback((map: L.Map) => {
    // Get container ID using the proper getContainer method
    const container = map.getContainer();
    console.log('Map reference provided, container ID:', container?.id);
    
    // Store the container ID to track it
    if (container?.id) {
      containerRefHistory.current.add(container.id);
    }
    
    // Safely cleanup any existing map before setting the new one
    if (mapRef.current) {
      console.log('Map reference already exists, removing previous instance');
      try {
        // Check if we can safely remove the map
        if (mapRef.current !== map) {
          mapRef.current.remove();
        }
      } catch (err) {
        console.warn('Error removing previous map instance:', err);
      }
      mapRef.current = null;
    }
    
    // Set the new map reference
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
        // Reset map instance if there's an error
        mapRef.current = null;
        // Generate a new key to force remounting of the map component
        setMapInstanceKey(`map-container-${Date.now()}`);
      }
    }
  }, [selectedLocation, isMapReady]);
  
  // Cleanup function for when component unmounts
  useEffect(() => {
    return () => {
      // Proper cleanup when component unmounts
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance on component unmount');
        try {
          // Use a local reference for the timeout to avoid accessing potentially null references
          const mapToRemove = mapRef.current;
          
          // Immediate removal with short timeout to prevent race conditions
          setTimeout(() => {
            try {
              if (document.body.contains(mapToRemove.getContainer())) {
                mapToRemove.remove();
              }
            } catch (e) {
              // Silent catch for cleanup errors during unmount
            }
          }, 0);
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        
        // Clear the reference immediately
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []);
  
  // Force map remount when view changes
  const forceMapRemount = useCallback(() => {
    // First, clean up any existing map
    if (mapRef.current) {
      try {
        // Capture and clear reference
        const mapToRemove = mapRef.current;
        mapRef.current = null;
        
        // Remove after a short delay
        setTimeout(() => {
          try {
            if (document.body.contains(mapToRemove.getContainer())) {
              mapToRemove.remove();
            }
          } catch (err) {
            console.warn('Error removing map during forced remount:', err);
          }
        }, 0);
      } catch (err) {
        console.warn('Error during map remount preparation:', err);
      }
    }
    
    // Generate a new unique key with additional randomness
    const newKey = `map-container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setMapInstanceKey(newKey);
    setIsMapReady(false);
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
  
  return {
    mapRef,
    isMapReady,
    mapInstanceKey,
    handleSetMapRef,
    handleLocationSelect,
    forceMapRemount
  };
};
