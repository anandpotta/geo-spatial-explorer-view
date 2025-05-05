
/**
 * Core functionality for applying clip masks to SVG elements
 * This is now a lightweight wrapper around more specialized functions
 */
import { toast } from 'sonner';
import { storeOriginalAttributes } from './clip-mask-attributes';
import { hasClipMaskApplied } from './clip-mask-checker';
import { createClipPath } from './clip-path-creator';
import { createImagePattern } from './image-pattern-creator';
import { applyElementAttributes } from './element-attributes';
import { showSuccessToast } from './toast-manager';

// Track which drawings have been displayed with toasts to avoid duplicates
const toastShown = new Set<string>();

/**
 * Creates and applies an SVG clip mask with an image to a path element
 */
export const applyImageClipMask = (
  pathElement: SVGPathElement | null, 
  imageUrl: string | object | null | undefined, 
  id: string
): boolean => {
  if (!pathElement || !imageUrl) {
    console.error('Cannot apply clip mask: missing path or image URL', { pathElement, imageUrl, id });
    return false;
  }
  
  try {
    // Ensure imageUrl is a string before attempting to use string methods
    const imageUrlString = typeof imageUrl === 'string' ? imageUrl : 
      (typeof imageUrl === 'object' && imageUrl !== null ? JSON.stringify(imageUrl) : '');
    
    if (!imageUrlString) {
      console.error('Invalid image URL format');
      return false;
    }
    
    // Check if already has clip mask (improved check)
    if (hasClipMaskApplied(pathElement)) {
      return true;
    }
    
    // Get the SVG element that contains this path
    const svg = pathElement.closest('svg');
    if (!svg) {
      console.error('SVG path is not within an SVG element');
      return false;
    }
    
    // Get the path data
    const pathData = pathElement.getAttribute('d');
    if (!pathData) {
      console.error('SVG path has no path data (d attribute)');
      return false;
    }
    
    // Store original path data and style for potential restoration
    storeOriginalAttributes(pathElement);
    
    // Add the drawing ID to the path for future reference
    pathElement.setAttribute('data-drawing-id', id);
    
    // Create the defs section if it doesn't exist
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);
    }
    
    // Clean up any existing elements with the same IDs first
    const existingClipPath = defs.querySelector(`#clip-${id}`);
    if (existingClipPath) defs.removeChild(existingClipPath);
    
    const existingPattern = defs.querySelector(`#pattern-${id}`);
    if (existingPattern) defs.removeChild(existingPattern);
    
    // Create clip path
    createClipPath(defs, id, pathData);
    
    // First, mark as having clip mask (prevents race conditions)
    pathElement.setAttribute('data-has-clip-mask', 'true');
    pathElement.setAttribute('data-last-updated', Date.now().toString());
    pathElement.setAttribute('data-drawing-id', id);
    
    // Load and process the image
    return processImageForClipMask(imageUrlString, pathElement, svg, defs, id);
  } catch (err) {
    console.error('Error applying image clip mask:', err);
    return false;
  }
};

/**
 * Process image for the clip mask
 */
const processImageForClipMask = (
  imageUrlString: string,
  pathElement: SVGPathElement,
  svg: SVGElement,
  defs: SVGDefsElement,
  id: string
): boolean => {
  // Create a pre-loaded image to get dimensions
  const tempImg = new Image();
  
  // Set crossorigin attribute to handle CORS correctly
  tempImg.crossOrigin = "anonymous";
  
  // Add timeout to prevent hanging on image load
  const imageTimeout = setTimeout(() => {
    console.warn(`Image load timed out for ${id}`);
    // Apply default dimensions if image load times out
    applyImageToPath(tempImg, 300, 300, pathElement, svg, defs, id);
  }, 5000);
  
  tempImg.onload = () => {
    clearTimeout(imageTimeout);
    applyImageToPath(tempImg, tempImg.width, tempImg.height, pathElement, svg, defs, id);
  };
  
  tempImg.onerror = () => {
    clearTimeout(imageTimeout);
    console.error('Failed to load image for clip mask');
    // Apply default dimensions as fallback
    applyImageToPath(tempImg, 300, 300, pathElement, svg, defs, id);
  };
  
  // Start loading the image
  tempImg.src = imageUrlString;
  
  return true;
};

/**
 * Apply image to path element
 */
const applyImageToPath = (
  img: HTMLImageElement,
  imgWidth: number,
  imgHeight: number,
  pathElement: SVGPathElement,
  svg: SVGElement,
  defs: SVGDefsElement,
  id: string
): boolean => {
  try {
    if (!svg || !pathElement || !document.contains(pathElement)) return false;
    
    // Get the bounding box to properly size the pattern
    const bbox = pathElement.getBBox();
    
    // Create the image pattern
    createImagePattern(defs, id, img.src, bbox, imgWidth, imgHeight);
    
    // Set default values for transformation
    applyElementAttributes(pathElement, id);
    
    // Show success toast (with duplicate prevention)
    showSuccessToast(id, toastShown);
    
    return true;
  } catch (err) {
    console.error('Error during image processing:', err);
    return false;
  }
};

/**
 * Reset the toast tracking when the page reloads
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    toastShown.clear();
  });
}
