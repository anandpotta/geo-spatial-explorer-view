// This file is a central export point for all API-related functions

export { 
  fetchMarkers,
  createMarker,
  deleteMarkerApi
} from '@/services/markers';

export {
  fetchDrawings,
  createDrawing,
  deleteDrawingApi
} from '@/services/drawings-service';

export {
  syncLocalDataWithBackend,
  checkBackendAvailability
} from '@/services/sync-service';
