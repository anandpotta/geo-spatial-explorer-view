
import { LocationMarker } from './types';
import { saveMarker } from './storage';

export function createMarker(markerData: {
  name: string;
  position: [number, number];
  type?: 'pin' | 'area' | 'building';
  description?: string;
}): LocationMarker {
  const marker: LocationMarker = {
    id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: markerData.name,
    position: markerData.position,
    type: markerData.type || 'pin',
    description: markerData.description,
    createdAt: new Date(),
    isPinned: false
  };

  saveMarker(marker);
  return marker;
}
