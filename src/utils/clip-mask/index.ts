
/**
 * Main entry point for clip mask functionality
 * This file re-exports all clip mask related functions
 */

// Re-export all clip mask related functions
export { hasClipMaskApplied } from './clip-mask-checker';
export { applyImageClipMask } from './clip-mask-apply';
export { removeClipMask } from './clip-mask-remove';
export { createClipPath } from './clip-path-creator';
export { createImagePattern, calculateFitDimensions } from './image-pattern-creator';
export { applyElementAttributes } from './element-attributes';
export { showSuccessToast } from './toast-manager';

