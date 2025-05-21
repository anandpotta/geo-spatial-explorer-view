
import { useRef, useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';

export function useMapInitialization(initialLocation?: Location) {
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapInstanceKey = useRef<number>(Date.now()).current;
  const initializationAttemptedRef = useRef(false);
  const mapContainerRef = useRef<HTMLElement | null>(null);

  // Clear map instance on unmount
  useEffect(() => {
    return () => {
      console.log("Map initialization cleanup: removing map instance");
      mapRef.current = null;
      initializationAttemptedRef.current = false;
      mapContainerRef.current = null;
    };
  }, []);

  const handleSetMapRef = (map: L.Map | null) => {
    if (map && !mapRef.current && !initializationAttemptedRef.current) {
      console.log("Map initialization: setting map reference");
      mapRef.current = map;
      
      // Set initialization flag to prevent duplicate initializations
      initializationAttemptedRef.current = true;
      
      // Add a small delay to ensure the map is fully rendered
      // before marking it as ready for other operations
      setTimeout(() => {
        setIsMapReady(true);
        console.log("Map initialization: map marked as ready");
        
        // Force map to update its size
        if (mapRef.current) {
          mapRef.current.invalidateSize(true);
        }
      }, 200);
    }
  };

  // For cases where we need direct access to the container element
  const setMapContainerRef = (element: HTMLElement | null) => {
    mapContainerRef.current = element;
  };

  return {
    mapRef,
    mapInstanceKey,
    isMapReady,
    handleSetMapRef,
    setMapContainerRef,
    mapContainerRef
  };
}
