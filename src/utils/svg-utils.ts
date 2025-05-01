
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
  findSvgPathByDrawingId,
  rotateImageInClipMask,
  scaleImageInClipMask
} from './svg-clip-mask';

