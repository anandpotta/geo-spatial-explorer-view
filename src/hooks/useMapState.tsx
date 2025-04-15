
import { useState } from 'react';
import { Location } from '@/utils/geo-utils';

export const useMapState = (selectedLocation?: Location) => {
  const [position, setPosition] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.y, selectedLocation.x] : [51.505, -0.09]
  );
  const [zoom, setZoom] = useState(18);

  return {
    position,
    setPosition,
    zoom,
    setZoom
  };
};
