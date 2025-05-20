
import { useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import { useAuth } from '@/contexts/AuthContext';

export function useBaseMapState(selectedLocation?: Location) {
  const { currentUser, isAuthenticated } = useAuth();
  const [position, setPosition] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.y, selectedLocation.x] : [51.505, -0.09]
  );
  const [zoom, setZoom] = useState(18);

  // Set up global position update handler for draggable markers
  useEffect(() => {
    window.tempMarkerPositionUpdate = (pos) => {
      console.log("Global tempMarkerPositionUpdate called:", pos);
    };
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  return {
    position,
    setPosition,
    zoom,
    setZoom,
    currentUser,
    isAuthenticated
  };
}
