
import { useState } from 'react';
import { Location } from '@/utils/geo-utils';

export function useMapPosition(selectedLocation?: Location) {
  const [position, setPosition] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.y, selectedLocation.x] : [51.505, -0.09]
  );
  const [zoom, setZoom] = useState(18);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return {
    position,
    setPosition,
    zoom,
    setZoom,
    activeTool,
    setActiveTool
  };
}
