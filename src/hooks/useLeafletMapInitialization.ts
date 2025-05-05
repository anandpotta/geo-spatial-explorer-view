
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
  
  // Map reference initialization function with proper cleanup
  const handleSetMapRef = useCallback((map: L.Map) => {
    console.log('Map reference provided');
    
    if (mapRef.current) {
      console.log('Map reference already exists, removing previous instance');
      mapRef.current.remove();
      mapRef.current = null;
    }
    
    // Set the new map reference
    mapRef.current = map;
    
    setTimeout(() => {
      if (mapRef.current) {
        try {
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
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
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
    handleLocationSelect
  };
};
