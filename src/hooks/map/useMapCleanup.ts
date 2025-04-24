
import { Map } from 'leaflet';
import { useEffect } from 'react';
import '../types/leaflet-extended.d.ts';

export function useMapCleanup(map: Map | null, initTimeoutRef: React.MutableRefObject<number | null>) {
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current !== null) {
        clearTimeout(initTimeoutRef.current);
      }

      if (map) {
        try {
          if (map.getContainer()) {
            map.off('click');
            delete map.hasMapClickHandler;
            delete map.isMapFullyInitialized;
          }
        } catch (error) {
          console.error('Error cleaning up map reference:', error);
        }
      }
    };
  }, [map, initTimeoutRef]);
}
