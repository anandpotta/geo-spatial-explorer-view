
export type { Location } from './location-utils';
export type { LocationMarker } from './marker-utils';
export type { DrawingData } from './drawing-utils';

export {
  searchLocations,
  formatCoordinates,
  getDistanceFromLatLonInKm,
} from './location-utils';

export {
  saveMarker,
  getSavedMarkers,
  deleteMarker,
} from './marker-utils';

export {
  saveDrawing,
  getSavedDrawings,
  deleteDrawing,
} from './drawing-utils';

// Export image transformation utilities
export {
  calculateFitScale,
  constrainPosition,
  saveImageTransformation,
  calculatePolygonFit
} from './image-transform-utils';

// Types for image transformations
export interface Position {
  x: number;
  y: number;
}

export interface ImageTransformation {
  rotation: number;
  scale: number;
  position: Position;
}

export interface FloorPlanData {
  data: string;
  isPdf: boolean;
  fileName: string;
  timestamp: string;
  transformation?: ImageTransformation;
}
