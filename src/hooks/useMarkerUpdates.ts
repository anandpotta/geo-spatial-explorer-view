
import { useEffect } from 'react';
import { getSavedMarkers } from '@/utils/marker-utils';

export const useMarkerUpdates = (setMarkers: (markers: any[]) => void) => {
  useEffect(() => {
    const handleMarkersUpdated = () => {
      const savedMarkers = getSavedMarkers();
      setMarkers(savedMarkers);
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
    };
  }, [setMarkers]);
};
