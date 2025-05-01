
/**
 * Functions for resetting image transformations
 */
import { removeClipMask, applyImageClipMask } from '../clip-mask';

/**
 * Resets all transformations on an image
 */
export const resetImageTransform = (pathElement: SVGPathElement | null): boolean => {
  if (!pathElement) return false;
  
  try {
    // Reset all transform attributes
    pathElement.setAttribute('data-image-rotation', '0');
    pathElement.setAttribute('data-image-scale', '1');
    pathElement.setAttribute('data-image-offset-x', '0');
    pathElement.setAttribute('data-image-offset-y', '0');
    
    // Find the pattern and image
    const patternId = pathElement.getAttribute('fill')?.replace('url(#', '').replace(')', '');
    if (!patternId) return false;
    
    const pattern = document.getElementById(patternId);
    if (!pattern) return false;
    
    const image = pattern.querySelector('image');
    if (!image) return false;
    
    // Reset the transform
    requestAnimationFrame(() => {
      image.setAttribute('transform', '');
      pathElement.setAttribute('data-last-updated', Date.now().toString());
      
      // Reapply the image with default settings
      const drawingId = pathElement.getAttribute('data-drawing-id');
      if (drawingId) {
        const href = image.getAttribute('href');
        if (href) {
          // Remove and reapply clip mask to reset perfectly
          removeClipMask(pathElement);
          setTimeout(() => {
            applyImageClipMask(pathElement, href, drawingId);
          }, 50);
        }
      }
    });
    
    return true;
  } catch (err) {
    console.error('Error resetting image transform:', err);
    return false;
  }
};
