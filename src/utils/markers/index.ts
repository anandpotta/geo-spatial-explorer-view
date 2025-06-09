
export { saveMarker, getSavedMarkers, deleteMarker, renameMarker } from './storage';
export { createMarker } from './factory';
export { syncMarkersWithBackend, fetchMarkersFromBackend, deleteMarkerFromBackend } from './sync';
export type { LocationMarker, MarkerData } from './types';
