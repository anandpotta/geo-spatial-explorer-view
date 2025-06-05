
import { useState, useCallback } from 'react';
import { Location } from '@/utils/geo-utils';

export function useMapPosition(selectedLocation?: Location) {
  const [position, setPosition] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.y, selectedLocation.x] : [51.505, -0.09]
  );
  const [zoom, setZoom] = useState(18);

  const updatePosition = useCallback((newPosition: [number, number]) => {
    setPosition(newPosition);
  }, []);

  const updateZoom = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  return {
    position,
    setPosition: updatePosition,
    zoom,
    setZoom: updateZoom
  };
}
