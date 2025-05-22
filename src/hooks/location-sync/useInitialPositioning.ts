
import { Location } from '@/utils/geo-utils';
import L from 'leaflet';
import { useTimers } from './useTimers';

export function useInitialPositioning() {
  const { safeSetTimeout } = useTimers();

  function forceInitialPositioning(
    map: L.Map | null, 
    selectedLocation: Location | undefined, 
    options: {
      isUnmountedRef: React.MutableRefObject<boolean>,
      setHasInitialPositioning: (value: boolean) => void
    }
  ) {
    if (!map || !selectedLocation || options.isUnmountedRef.current) return;
    
    try {
      console.log("useInitialPositioning: Forcing basic positioning approach");
      map.invalidateSize(true);
      map.setView([selectedLocation.y, selectedLocation.x], 14, { animate: false });
      options.setHasInitialPositioning(true);
    } catch (err) {
      console.error("Error in force positioning:", err);
    }
  }

  function handleMapReady(
    map: L.Map | null, 
    isMapReady: boolean, 
    selectedLocation: Location | undefined,
    hasInitialPositioning: boolean,
    options: {
      isUnmountedRef: React.MutableRefObject<boolean>,
      setHasInitialPositioning: (value: boolean) => void
    }
  ) {
    if (!map || !isMapReady) return;

    safeSetTimeout(() => {
      if (!options.isUnmountedRef.current && map) {
        console.log("useInitialPositioning: Map is ready, forcing invalidateSize");
        map.invalidateSize(true);
        
        // If we have a location but haven't positioned the map yet, do it now
        if (selectedLocation && !hasInitialPositioning) {
          forceInitialPositioning(map, selectedLocation, options);
        }
      }
    }, 300);
  }

  return {
    forceInitialPositioning,
    handleMapReady
  };
}
