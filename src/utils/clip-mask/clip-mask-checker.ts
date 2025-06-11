
/**
 * Utilities for checking clip mask state on SVG elements
 */

/**
 * Check if a path element already has a clip mask applied
 */
export const hasClipMaskApplied = (pathElement: SVGPathElement): boolean => {
  if (!pathElement) return false;
  
  // Check for the data attribute that marks it as having a clip mask
  const hasClipMaskAttr = pathElement.getAttribute('data-has-clip-mask') === 'true';
  
  // Also check if it has the fill pattern applied
  const fill = pathElement.style.fill || pathElement.getAttribute('fill');
  const hasPatternFill = fill && fill.includes('url(#pattern-');
  
  // Check if it has a clip-path applied
  const clipPath = pathElement.style.clipPath || pathElement.getAttribute('clip-path');
  const hasClipPath = clipPath && clipPath.includes('url(#clip-');
  
  return hasClipMaskAttr && hasPatternFill && hasClipPath;
};

/**
 * Remove clip mask from a path element
 */
export const removeClipMask = (pathElement: SVGPathElement): void => {
  if (!pathElement) return;
  
  try {
    // Clean up fill protection first
    const { cleanupFillProtection } = require('./core/svg-elements');
    cleanupFillProtection(pathElement);
    
    // Remove clip mask attributes and styles
    pathElement.removeAttribute('data-has-clip-mask');
    pathElement.removeAttribute('data-image-url');
    pathElement.removeAttribute('data-image-rotation');
    pathElement.removeAttribute('data-image-scale');
    pathElement.removeAttribute('data-image-offset-x');
    pathElement.removeAttribute('data-image-offset-y');
    pathElement.removeAttribute('data-last-updated');
    pathElement.removeAttribute('data-user-id');
    
    // Remove styles
    pathElement.style.removeProperty('fill');
    pathElement.style.removeProperty('clip-path');
    pathElement.removeAttribute('fill');
    pathElement.removeAttribute('clip-path');
    
    // Remove classes
    pathElement.classList.remove('has-image-fill');
    pathElement.classList.remove('loading-clip-mask');
    pathElement.classList.remove('visible-path-stroke');
    
    // Restore original attributes if they exist
    const originalFill = pathElement.getAttribute('data-original-fill');
    if (originalFill) {
      pathElement.setAttribute('fill', originalFill);
    }
    
    const originalStroke = pathElement.getAttribute('data-original-stroke');
    if (originalStroke) {
      pathElement.setAttribute('stroke', originalStroke);
    }
    
    console.log('Clip mask removed successfully');
  } catch (err) {
    console.error('Error removing clip mask:', err);
  }
};
