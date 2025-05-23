
// Export all marker utility functions and types
export type { LocationMarker } from './types';
export { getSavedMarkers, saveMarker, deleteMarker, renameMarker } from './storage';
export { createMarker } from './factory';
export { syncMarkersWithBackend, fetchMarkersFromBackend, deleteMarkerFromBackend } from './sync';
