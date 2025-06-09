
// This file is maintained for backward compatibility
// All functionality has been moved to the markers/ directory

export type { LocationMarker } from './markers/types';
export { 
  saveMarker, 
  getSavedMarkers, 
  deleteMarker,
  renameMarker,
  createMarker,
  syncMarkersWithBackend,
  fetchMarkersFromBackend,
  deleteMarkerFromBackend
} from './markers/index';
