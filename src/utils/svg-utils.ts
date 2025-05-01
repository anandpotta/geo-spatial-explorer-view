
/**
 * Main SVG utilities file that exports all SVG-related functions
 */

// Re-export everything from the separate modules
export {
  getSvgPathFromElement,
  simplifyPath,
  extractPointsFromPath,
  simplifyPoints,
  pointsToPathData,
  getAllSvgPaths
} from './svg-path-manipulation';

export {
  findSvgPathByDrawingId
} from './svg-path-finder';

export {
  hasClipMaskApplied,
  applyImageClipMask,
  removeClipMask
} from './clip-mask/index';

export {
  rotateImageInClipMask,
  scaleImageInClipMask
} from './svg-image-operations';
