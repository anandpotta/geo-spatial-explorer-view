
/**
 * Main entry point for SVG clip mask functionality
 * This file re-exports functions from more specialized modules
 */

// Re-export path finding functions
export { findSvgPathByDrawingId } from './svg-path-finder';

// Re-export clip mask utility functions
export { 
  hasClipMaskApplied
} from './clip-mask/clip-mask-checker';

export {
  applyImageClipMask
} from './clip-mask/clip-mask-apply';

export {
  removeClipMask
} from './clip-mask/clip-mask-remove';

// Re-export image manipulation functions
export {
  rotateImageInClipMask,
  scaleImageInClipMask,
  moveImageInClipMask,
  resetImageTransform
} from './svg-image-operations';

