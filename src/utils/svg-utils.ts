
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
  applyImageClipMask,
  removeClipMask,
  findSvgPathByDrawingId
} from './svg-clip-mask';

export {
  rotateImageInClipMask,
  scaleImageInClipMask
} from './svg-image-operations';
