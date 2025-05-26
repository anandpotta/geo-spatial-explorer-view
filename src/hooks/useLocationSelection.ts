
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
  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in useLocationSelection:", position);
    console.log("Map ready state:", isMapReady);
    console.log("Map ref current:", !!mapRef.current);
    
    // Simplified validation - just check if map exists and is ready
    if (!mapRef.current || !isMapReady) {
      console.warn("Map is not ready yet, retrying in 1 second");
      toast.error("Map is not fully loaded yet. Retrying...");
      
      // Retry after a short delay
      setTimeout(() => {
        if (mapRef.current && isMapReady) {
          handleLocationSelect(position);
        }
      }, 1000);
      return;
    }
    
    try {
      console.log("Attempting to fly to position:", position);
      
      // Fly to the location
      mapRef.current.flyTo(position, 18, {
        animate: true,
        duration: 1.5
      });
      
      // If the fly operation succeeded, proceed with location selection
      if (onLocationSelect) {
        const location: Location = {
          id: `loc-${position[0]}-${position[1]}`,
          label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
          x: position[1],
          y: position[0]
        };
        console.log("Calling onLocationSelect with:", location);
        onLocationSelect(location);
      }
      
      toast.success("Navigated to location successfully");
    } catch (err) {
      console.error('Error during map navigation:', err);
      toast.error("Navigation failed. Please try again.");
    }
  };

  const handleClearAll = () => {
    if (mapRef.current && isMapReady) {
      try {
        // Cast to internal map type to access private properties
        const internalMap = mapRef.current as LeafletMapInternal;
        if (internalMap._loaded) {
          mapRef.current.invalidateSize();
        }
      } catch (err) {
        console.error('Error invalidating map size:', err);
      }
    }
  };

  return {
    handleLocationSelect,
    handleClearAll
  };
}
