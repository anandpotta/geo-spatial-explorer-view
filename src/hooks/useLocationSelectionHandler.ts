
import { Location } from '@/utils/geo-utils';
import { toast } from 'sonner';

export const useLocationSelectionHandler = (
  mapRef: React.RefObject<L.Map>,
  isMapInitialized: boolean,
  cleanupInProgress: React.MutableRefObject<boolean>
) => {
  const handleSavedLocationSelect = (
    position: [number, number],
    onLocationSelect?: (location: Location) => void
  ) => {
    console.log("Location selected in LeafletMap:", position);
    
    // Reset the userHasInteracted flag when explicitly selecting a new location
    window.userHasInteracted = false;
    window.tempMarkerPlaced = false;
    
    if (onLocationSelect) {
      const location: Location = {
        id: `loc-${position[0].toFixed(4)}-${position[1].toFixed(4)}`,
        label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
        y: position[0],
        x: position[1]
      };
      onLocationSelect(location);
    }
    
    const [lat, lng] = position;
    if (mapRef.current && isMapInitialized && !cleanupInProgress.current) {
      try {
        setTimeout(() => {
          if (!mapRef.current || !isMapInitialized || cleanupInProgress.current) return;
          
          // Only navigate if the user hasn't interacted with the map since location selection
          if (!window.userHasInteracted && !window.tempMarkerPlaced) {
            const safeMapFlyTo = (map: L.Map, lat: number, lng: number) => {
              try {
                map.flyTo([lat, lng], 18, { animate: true, duration: 1.5 });
              } catch (err) {
                console.error('Error flying to location:', err);
              }
            };
            
            // Force navigation when explicitly selected by user
            safeMapFlyTo(mapRef.current, lat, lng);
          }
        }, 500);
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  };

  return handleSavedLocationSelect;
};
