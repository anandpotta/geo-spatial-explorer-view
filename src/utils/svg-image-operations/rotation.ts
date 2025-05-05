
/**
 * Functions related to image rotation in SVG clip masks
 */
import { getImageComponents } from './utils';

/**
 * Rotates an image in a clip mask
 */
export const rotateImageInClipMask = (pathElement: SVGPathElement | null, degrees: number): boolean => {
  if (!pathElement) return false;
  
  try {
    // Get the current rotation or default to 0
    const currentRotation = parseInt(pathElement.getAttribute('data-image-rotation') || '0');
    const newRotation = (currentRotation + degrees) % 360;
    
    // Update the rotation attribute
    pathElement.setAttribute('data-image-rotation', newRotation.toString());
    
    // Find the pattern and image
    const { image, centerX, centerY, scale, offsetX, offsetY } = getImageComponents(pathElement);
    if (!image) return false;
    
    // Apply the new rotation without causing reflow
    requestAnimationFrame(() => {
      // Apply transform with rotation, scale and translation
      image.setAttribute(
        'transform', 
        `translate(${offsetX} ${offsetY}) rotate(${newRotation} ${centerX} ${centerY}) scale(${scale})`
      );
      
      pathElement.setAttribute('data-last-updated', Date.now().toString());
      
      // Force repaint of just this element to avoid flickering
      if (pathElement.parentElement) {
        // Use a technique that doesn't cause layout thrashing
        const display = pathElement.parentElement.style.display;
        pathElement.parentElement.style.display = 'none';
        // Force reflow
        void pathElement.parentElement.getBoundingClientRect();
        pathElement.parentElement.style.display = display;
      }
    });
    
    return true;
  } catch (err) {
    console.error('Error rotating image in clip mask:', err);
    return false;
  }
};
