
export type { Location } from './location-utils';
export type { LocationMarker } from './marker-utils';
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
} from './marker-utils';

export {
  saveDrawing,
  getSavedDrawings,
  deleteDrawing,
} from './drawing-utils';

export {
  storeFloorPlan as saveFloorPlan,
  getFloorPlan as getFloorPlanById,
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
