
/**
 * Functions related to image positioning in SVG clip masks
 */
import { getImageComponents } from './utils';

/**
 * Moves an image within its clip mask
 */
export const moveImageInClipMask = (pathElement: SVGPathElement | null, deltaX: number, deltaY: number): boolean => {
  if (!pathElement) return false;
  
  try {
    // Get current offsets or default to 0
    const currentOffsetX = parseFloat(pathElement.getAttribute('data-image-offset-x') || '0');
    const currentOffsetY = parseFloat(pathElement.getAttribute('data-image-offset-y') || '0');
    
    // Calculate new offsets
    const newOffsetX = currentOffsetX + deltaX;
    const newOffsetY = currentOffsetY + deltaY;
    
    // Update the offset attributes
    pathElement.setAttribute('data-image-offset-x', newOffsetX.toString());
    pathElement.setAttribute('data-image-offset-y', newOffsetY.toString());
    
    // Find the pattern and image
    const { image, centerX, centerY, rotation, scale } = getImageComponents(pathElement);
    if (!image) return false;
    
    // Apply the new position without causing reflow
    requestAnimationFrame(() => {
      image.setAttribute(
        'transform', 
        `translate(${newOffsetX} ${newOffsetY}) rotate(${rotation} ${centerX} ${centerY}) scale(${scale})`
      );
      
      pathElement.setAttribute('data-last-updated', Date.now().toString());
      
      // Force repaint to avoid flickering
      if (pathElement.parentElement) {
        const display = pathElement.parentElement.style.display;
        pathElement.parentElement.style.display = 'none';
        void pathElement.parentElement.getBoundingClientRect();
        pathElement.parentElement.style.display = display;
      }
    });
    
    return true;
  } catch (err) {
    console.error('Error moving image in clip mask:', err);
    return false;
  }
};
