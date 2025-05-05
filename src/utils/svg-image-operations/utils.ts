
/**
 * Shared utility functions for SVG image operations
 */

/**
 * Image component interface to hold all necessary information
 */
export interface ImageComponents {
  image: SVGImageElement | null;
  centerX: number;
  centerY: number;
  rotation: string;
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Gets the image components needed for transformations
 */
export const getImageComponents = (pathElement: SVGPathElement): ImageComponents => {
  // Default values
  const defaultComponents: ImageComponents = {
    image: null,
    centerX: 0,
    centerY: 0,
    rotation: '0',
    scale: 1,
    offsetX: 0,
    offsetY: 0
  };
  
  try {
    // Find the pattern and image
    const patternId = pathElement.getAttribute('fill')?.replace('url(#', '').replace(')', '');
    if (!patternId) return defaultComponents;
    
    const pattern = document.getElementById(patternId);
    if (!pattern) return defaultComponents;
    
    const image = pattern.querySelector('image');
    if (!image) return defaultComponents;
    
    // Get the bounding box
    const bbox = pathElement.getBBox();
    const centerX = bbox.width / 2 + bbox.x;
    const centerY = bbox.height / 2 + bbox.y;
    
    // Get current transformation values
    const rotation = pathElement.getAttribute('data-image-rotation') || '0';
    const scale = parseFloat(pathElement.getAttribute('data-image-scale') || '1');
    const offsetX = parseFloat(pathElement.getAttribute('data-image-offset-x') || '0');
    const offsetY = parseFloat(pathElement.getAttribute('data-image-offset-y') || '0');
    
    return {
      image,
      centerX,
      centerY,
      rotation,
      scale,
      offsetX,
      offsetY
    };
  } catch (err) {
    console.error('Error getting image components:', err);
    return defaultComponents;
  }
};
