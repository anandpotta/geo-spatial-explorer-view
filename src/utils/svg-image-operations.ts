
/**
 * Utilities for manipulating images in SVG clip masks
 */

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
    const patternId = pathElement.getAttribute('fill')?.replace('url(#', '').replace(')', '');
    if (!patternId) return false;
    
    const pattern = document.getElementById(patternId);
    if (!pattern) return false;
    
    const image = pattern.querySelector('image');
    if (!image) return false;
    
    // Get the bounding box
    const bbox = pathElement.getBBox();
    const centerX = bbox.width / 2 + bbox.x;
    const centerY = bbox.height / 2 + bbox.y;
    
    // Get current scale
    const scale = parseFloat(pathElement.getAttribute('data-image-scale') || '1');
    
    // Get current offsets
    const offsetX = parseFloat(pathElement.getAttribute('data-image-offset-x') || '0');
    const offsetY = parseFloat(pathElement.getAttribute('data-image-offset-y') || '0');
    
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
    const patternId = pathElement.getAttribute('fill')?.replace('url(#', '').replace(')', '');
    if (!patternId) return false;
    
    const pattern = document.getElementById(patternId);
    if (!pattern) return false;
    
    const image = pattern.querySelector('image');
    if (!image) return false;
    
    // Get the bounding box and rotation
    const bbox = pathElement.getBBox();
    const centerX = bbox.width / 2 + bbox.x;
    const centerY = bbox.height / 2 + bbox.y;
    const rotation = pathElement.getAttribute('data-image-rotation') || '0';
    
    // Get current offsets
    const offsetX = parseFloat(pathElement.getAttribute('data-image-offset-x') || '0');
    const offsetY = parseFloat(pathElement.getAttribute('data-image-offset-y') || '0');
    
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
    const patternId = pathElement.getAttribute('fill')?.replace('url(#', '').replace(')', '');
    if (!patternId) return false;
    
    const pattern = document.getElementById(patternId);
    if (!pattern) return false;
    
    const image = pattern.querySelector('image');
    if (!image) return false;
    
    // Get the bounding box, rotation, and scale
    const bbox = pathElement.getBBox();
    const centerX = bbox.width / 2 + bbox.x;
    const centerY = bbox.height / 2 + bbox.y;
    const rotation = pathElement.getAttribute('data-image-rotation') || '0';
    const scale = pathElement.getAttribute('data-image-scale') || '1';
    
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

// Import needed functions from clip-mask-operations
import { applyImageClipMask, removeClipMask } from './svg-clip-mask-operations';

