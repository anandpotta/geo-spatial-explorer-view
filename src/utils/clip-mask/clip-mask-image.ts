
/**
 * Utilities for handling images in clip masks
 */

/**
 * Calculate the appropriate scale and position for an image in a clip mask
 */
export const calculateImagePlacement = (
  bbox: DOMRect, 
  imgWidth: number, 
  imgHeight: number
): { 
  scaleX: number; 
  scaleY: number; 
  scale: number; 
  scaledWidth: number; 
  scaledHeight: number; 
  offsetX: number; 
  offsetY: number; 
} => {
  // Calculate scale to fit the image properly within the shape
  const scaleX = bbox.width / imgWidth;
  const scaleY = bbox.height / imgHeight;
  const scale = Math.max(scaleX, scaleY); // Use max to ensure image covers the shape
  
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;
  
  // Calculate position to center the image
  const offsetX = (bbox.width - scaledWidth) / 2 + bbox.x;
  const offsetY = (bbox.height - scaledHeight) / 2 + bbox.y;
  
  return {
    scaleX,
    scaleY,
    scale,
    scaledWidth,
    scaledHeight,
    offsetX,
    offsetY
  };
};

/**
 * Creates image and pattern elements for an SVG clip mask
 */
export const createPatternWithImage = (
  defs: SVGDefsElement,
  id: string,
  imageUrl: string,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number
): { pattern: SVGPatternElement; image: SVGImageElement } => {
  // Create a pattern for the image with calculated dimensions
  const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
  pattern.setAttribute('id', `pattern-${id}`);
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  pattern.setAttribute('x', String(offsetX));
  pattern.setAttribute('y', String(offsetY));
  pattern.setAttribute('width', String(width));
  pattern.setAttribute('height', String(height));
  defs.appendChild(pattern);
  
  // Create an image element for the pattern
  const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  image.setAttribute('href', imageUrl);
  image.setAttribute('width', String(width));
  image.setAttribute('height', String(height));
  image.setAttribute('x', '0');
  image.setAttribute('y', '0');
  image.setAttribute('preserveAspectRatio', 'none'); // Don't preserve aspect ratio for better fitting
  pattern.appendChild(image);
  
  return { pattern, image };
};
