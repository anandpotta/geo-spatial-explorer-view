
import { toast } from 'sonner';
import { Location } from '@/utils/geo-utils';

export function useLocationSelection(
  mapRef: React.MutableRefObject<L.Map | null>,
  isMapReady: boolean,
  onLocationSelect?: (location: Location) => void
) {
  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in useLocationSelection:", position);
    if (!mapRef.current || !isMapReady) {
      console.warn("Map is not ready yet, cannot navigate");
      toast.error("Map is not fully loaded yet. Please try again in a moment.");
      return;
    }
    
    try {
      if (!mapRef.current.getContainer() || !document.body.contains(mapRef.current.getContainer())) {
        console.warn("Map container is not in DOM, cannot navigate");
        toast.error("Map view is not available. Please refresh the page.");
        return;
      }
      
      mapRef.current.flyTo(position, 18, {
        animate: true,
        duration: 1.5
      });
      
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
      toast.error("Could not navigate to location. Please try again.");
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
