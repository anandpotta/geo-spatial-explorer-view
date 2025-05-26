
import { toast } from 'sonner';
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';

export function useLocationSelection(
  mapRef: React.MutableRefObject<L.Map | null>,
  isMapReady: boolean,
  onLocationSelect?: (location: Location) => void
) {
  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in useLocationSelection:", position);
    console.log("Map ready state:", isMapReady);
    console.log("Map ref current:", !!mapRef.current);
    
    // Check if map exists
    if (!mapRef.current) {
      console.warn("Map reference is null, cannot navigate");
      toast.error("Map is not available. Please try again.");
      return;
    }
    
    try {
      console.log("Attempting to fly to position:", position);
      
      // Force fly to the location regardless of ready state
      mapRef.current.flyTo(position, 18, {
        animate: true,
        duration: 1.5
      });
      
      // If onLocationSelect callback is provided, call it
      if (onLocationSelect) {
        const location: Location = {
          id: `loc-${position[0]}-${position[1]}-${Date.now()}`,
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
    if (mapRef.current) {
      try {
        mapRef.current.invalidateSize();
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
