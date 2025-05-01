
/**
 * Functions related to image scaling in SVG clip masks
 */
import { getImageComponents } from './utils';

/**
 * Scales an image in a clip mask
 */
export const scaleImageInClipMask = (pathElement: SVGPathElement | null, scaleFactor: number): boolean => {
  if (!pathElement) return false;
  
  try {
    // Get current scale or default to 1
    const currentScale = parseFloat(pathElement.getAttribute('data-image-scale') || '1');
    let newScale = currentScale * scaleFactor;
    
    // Limit the scale to reasonable bounds
    newScale = Math.max(0.2, Math.min(5, newScale));
    
    // Update the scale attribute
    pathElement.setAttribute('data-image-scale', newScale.toString());
    
    // Find the pattern and image
    const { image, centerX, centerY, rotation, offsetX, offsetY } = getImageComponents(pathElement);
    if (!image) return false;
    
    // Apply the new scale without causing reflow
    requestAnimationFrame(() => {
      image.setAttribute(
        'transform', 
        `translate(${offsetX} ${offsetY}) rotate(${rotation} ${centerX} ${centerY}) scale(${newScale})`
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
    console.error('Error scaling image in clip mask:', err);
    return false;
  }
};
