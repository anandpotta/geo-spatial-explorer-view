
import { useRef, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';

export function useLastSelectedLocation(selectedLocation: Location | undefined) {
  const lastSelectedLocationRef = useRef<Location | undefined>(undefined);
  
  // Track location changes to prevent duplicate transitions
  useEffect(() => {
    if (selectedLocation && selectedLocation !== lastSelectedLocationRef.current) {
      console.log('Location tracking: New location selected:', selectedLocation.label);
      lastSelectedLocationRef.current = selectedLocation;
    }
  }, [selectedLocation]);
  
  return lastSelectedLocationRef;
}
