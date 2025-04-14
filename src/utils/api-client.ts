
export { 
  fetchMarkers,
  createMarker,
  deleteMarkerApi
} from '@/services/markers-service';

export {
  fetchDrawings,
  createDrawing,
  deleteDrawingApi
} from '@/services/drawings-service';

export {
  syncLocalDataWithBackend,
  checkBackendAvailability
} from '@/services/sync-service';
