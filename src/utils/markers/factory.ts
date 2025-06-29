
import { LocationMarker } from './types';
import { saveMarker } from './storage';

/**
 * Create a new marker with default values
 */
export function createMarker(markerData: Partial<LocationMarker>): LocationMarker {
  const marker: LocationMarker = {
    id: markerData.id || crypto.randomUUID(),
    name: markerData.name || 'Unnamed Location',
    position: markerData.position || [0, 0],
    type: markerData.type || 'pin',
    description: markerData.description,
    createdAt: markerData.createdAt || new Date(),
    isPinned: markerData.isPinned || false,
    associatedDrawing: markerData.associatedDrawing,
    userId: 'anonymous' // Default to anonymous since auth is removed
  };
  
  saveMarker(marker);
  return marker;
}
