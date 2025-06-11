
import { LocationMarker } from './types';
import { getCurrentUser } from '../../services/auth-service';
import { saveMarker } from './storage';

/**
 * Create a new marker with default values
 */
export function createMarker(markerData: Partial<LocationMarker>): LocationMarker {
  const currentUser = getCurrentUser();
  
  // Allow creation for both authenticated and anonymous users
  const userId = currentUser ? currentUser.id : 'anonymous';
  
  const marker: LocationMarker = {
    id: markerData.id || crypto.randomUUID(),
    name: markerData.name || 'Unnamed Location',
    position: markerData.position || [0, 0],
    type: markerData.type || 'pin',
    description: markerData.description,
    createdAt: markerData.createdAt || new Date(),
    isPinned: markerData.isPinned || false,
    associatedDrawing: markerData.associatedDrawing,
    userId: userId
  };
  
  saveMarker(marker);
  return marker;
}
