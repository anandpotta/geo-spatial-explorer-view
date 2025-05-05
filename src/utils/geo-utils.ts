
export type { Location } from './location-utils';
export type { LocationMarker } from './markers/types';
export type { DrawingData } from './drawing-utils';
export type { FloorPlanData } from './floor-plan-utils';

export {
  searchLocations,
  formatCoordinates,
  getDistanceFromLatLonInKm,
} from './location-utils';

export {
  saveMarker,
  getSavedMarkers,
  deleteMarker,
} from './markers/index';

export {
  saveDrawing,
  getSavedDrawings,
  deleteDrawing,
} from './drawing-utils';

export {
  saveFloorPlan,
  getFloorPlanById,
  hasFloorPlan,
  getDrawingIdsWithFloorPlans,
} from './floor-plan-utils';

// Export from our refactored SVG utilities
export {
  getSvgPathFromElement,
  simplifyPath,
  extractPointsFromPath,
  simplifyPoints,
  pointsToPathData,
  getAllSvgPaths,
  applyImageClipMask,
  removeClipMask,
} from './svg-utils';
