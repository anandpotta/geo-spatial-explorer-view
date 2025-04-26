
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';

export function useLocationSelection(
  mapRef: React.RefObject<L.Map>,
  onLocationSelect?: (location: Location) => void
) {
  const handleLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    if (mapRef.current) {
      try {
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
      }
    }
  };

  return { handleLocationSelect };
}
