
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';
import { isMapValid } from '@/utils/leaflet-type-utils';

// Define interface for internal map properties not exposed in TypeScript definitions
interface LeafletMapInternal extends L.Map {
  _loaded?: boolean;
}

export function useLocationSelection(
  mapRef: React.MutableRefObject<L.Map | null>,
  isMapReady: boolean,
  onLocationSelect?: (location: Location) => void
) {
  const handleLocationSelect = useCallback((position: [number, number]) => {
    console.log("Location selected in useLocationSelection:", position);
    
    // Use utility function to validate map
    if (!mapRef.current || !isMapValid(mapRef.current) || !isMapReady) {
      console.warn("Map is not ready yet, cannot navigate");
      toast.error("Map is not fully loaded yet. Please try again in a moment.");
      return;
    }
    
    try {
      // Enhanced check for map container validity
      if (!mapRef.current.getContainer()) {
        console.warn("Map container is not available, cannot navigate");
        toast.error("Map view is not available. Please refresh the page.");
        return;
      }
      
      // Check if the container is actually in the DOM
      if (!document.body.contains(mapRef.current.getContainer())) {
        console.warn("Map container is not in DOM, cannot navigate");
        toast.error("Map view is not currently visible. Please switch to map view first.");
        return;
      }
      
      // Additional check to ensure the map is properly initialized
      const internalMap = mapRef.current as LeafletMapInternal;
      if (!internalMap._loaded) {
        console.warn("Map is not fully loaded yet, cannot navigate");
        toast.error("Map is still initializing. Please try again in a moment.");
        return;
      }
      
      // Perform the navigation
      mapRef.current.flyTo(position, 18, {
        animate: true,
        duration: 1.5
      });
      
      // Call the callback with location data
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
      console.error('Error handling location selection:', err);
      toast.error("Could not navigate to location. Please try again.");
    }
  }, [mapRef, isMapReady, onLocationSelect]);

  const handleClearAll = useCallback(() => {
    if (mapRef.current && isMapReady) {
      try {
        const internalMap = mapRef.current as LeafletMapInternal;
        if (internalMap._loaded) {
          mapRef.current.invalidateSize();
        }
      } catch (err) {
        console.error('Error invalidating map size:', err);
      }
    }
  }, [mapRef, isMapReady]);

  return {
    handleLocationSelect,
    handleClearAll
  };
}
