
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
    const scale = pathElement.getAttribute('data-image-scale') || '1';
    
    // Apply the new rotation
    image.setAttribute('transform', `rotate(${newRotation} ${centerX} ${centerY}) scale(${scale})`);
    
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
    newScale = Math.max(0.2, Math.min(3, newScale));
    
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
    
    // Apply the new scale with existing rotation
    image.setAttribute('transform', `rotate(${rotation} ${centerX} ${centerY}) scale(${newScale})`);
    
    return true;
  } catch (err) {
    console.error('Error scaling image in clip mask:', err);
    return false;
  }
};
