
/**
 * Utility functions for creating SVG image patterns
 */

/**
 * Calculate dimensions to fit image properly within a shape
 */
interface FitDimensions {
  scaledWidth: number;
  scaledHeight: number;
  offsetX: number;
  offsetY: number;
}

export const calculateFitDimensions = (
  bbox: SVGRect,
  imgWidth: number,
  imgHeight: number
): FitDimensions => {
  // Calculate scale to fit the image properly within the shape
  const scaleX = bbox.width / imgWidth;
  const scaleY = bbox.height / imgHeight;
  const scale = Math.max(scaleX, scaleY); // Use max to ensure image covers the shape
  
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;
  
  // Calculate position to center the image
  const offsetX = (bbox.width - scaledWidth) / 2 + bbox.x;
  const offsetY = (bbox.height - scaledHeight) / 2 + bbox.y;
  
  return { scaledWidth, scaledHeight, offsetX, offsetY };
};

/**
 * Creates an image pattern in the SVG defs
 */
export const createImagePattern = (
  defs: SVGDefsElement,
  id: string,
  imageUrl: string,
  bbox: SVGRect,
  imgWidth: number,
  imgHeight: number
): SVGPatternElement => {
  const { scaledWidth, scaledHeight, offsetX, offsetY } = calculateFitDimensions(bbox, imgWidth, imgHeight);
  
  // Create a pattern for the image with calculated dimensions
  const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
  pattern.setAttribute('id', `pattern-${id}`);
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  pattern.setAttribute('x', String(offsetX));
  pattern.setAttribute('y', String(offsetY));
  pattern.setAttribute('width', String(scaledWidth));
  pattern.setAttribute('height', String(scaledHeight));
  defs.appendChild(pattern);
  
  // Create an image element for the pattern
  const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  image.setAttribute('href', imageUrl);
  image.setAttribute('width', String(scaledWidth));
  image.setAttribute('height', String(scaledHeight));
  image.setAttribute('x', '0');
  image.setAttribute('y', '0');
  image.setAttribute('preserveAspectRatio', 'none'); // Don't preserve aspect ratio for better fitting
  pattern.appendChild(image);
  
  return pattern;
};
