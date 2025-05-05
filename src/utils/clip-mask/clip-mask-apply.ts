
/**
 * Core functionality for applying clip masks to SVG elements
 */
import { toast } from 'sonner';
import { storeOriginalAttributes } from './clip-mask-attributes';
import { hasClipMaskApplied } from './clip-mask-checker';

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
    
    // Create a clip path element
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', `clip-${id}`);
    defs.appendChild(clipPath);
    
    // Create a path for the clip path
    const clipPathPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    clipPathPath.setAttribute('d', pathData);
    clipPath.appendChild(clipPathPath);
    
    // First, mark as having clip mask (prevents race conditions)
    pathElement.setAttribute('data-has-clip-mask', 'true');
    pathElement.setAttribute('data-last-updated', Date.now().toString());
    pathElement.setAttribute('data-drawing-id', id);
    
    // Create a pre-loaded image to get dimensions
    const tempImg = new Image();
    
    // Set crossorigin attribute to handle CORS correctly
    tempImg.crossOrigin = "anonymous";
    
    // Add timeout to prevent hanging on image load
    const imageTimeout = setTimeout(() => {
      console.warn(`Image load timed out for ${id}`);
      // Apply default dimensions if image load times out
      applyImageWithDimensions(300, 300);
    }, 5000);
    
    tempImg.onload = () => {
      clearTimeout(imageTimeout);
      applyImageWithDimensions(tempImg.width, tempImg.height);
    };
    
    tempImg.onerror = () => {
      clearTimeout(imageTimeout);
      console.error('Failed to load image for clip mask');
      // Don't show error toasts for image load errors to reduce spam
      // Apply default dimensions as fallback
      applyImageWithDimensions(300, 300);
    };
    
    // Function to apply the image with known dimensions
    function applyImageWithDimensions(imgWidth: number, imgHeight: number) {
      try {
        if (!svg || !pathElement || !document.contains(pathElement)) return; // Safety check
        
        // Get the bounding box to properly size the pattern
        const bbox = pathElement.getBBox();
        
        // Calculate scale to fit the image properly within the shape
        const scaleX = bbox.width / imgWidth;
        const scaleY = bbox.height / imgHeight;
        const scale = Math.max(scaleX, scaleY); // Use max to ensure image covers the shape
        
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        
        // Calculate position to center the image
        const offsetX = (bbox.width - scaledWidth) / 2 + bbox.x;
        const offsetY = (bbox.height - scaledHeight) / 2 + bbox.y;
        
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
        image.setAttribute('href', imageUrlString);
        image.setAttribute('width', String(scaledWidth));
        image.setAttribute('height', String(scaledHeight));
        image.setAttribute('x', '0');
        image.setAttribute('y', '0');
        image.setAttribute('preserveAspectRatio', 'none'); // Don't preserve aspect ratio for better fitting
        pattern.appendChild(image);
        
        // Set default values for transformation
        pathElement.setAttribute('data-image-rotation', '0');
        pathElement.setAttribute('data-image-scale', '1');
        pathElement.setAttribute('data-image-offset-x', '0');
        pathElement.setAttribute('data-image-offset-y', '0');
        
        // Use requestAnimationFrame for smoother visual updates
        requestAnimationFrame(() => {
          if (!pathElement || !document.contains(pathElement)) return;
          
          // Apply all changes in a single batch to reduce visual flickering
          const fill = `url(#pattern-${id})`;
          const clipPathUrl = `url(#clip-${id})`;
          
          pathElement.style.fill = fill;
          pathElement.style.stroke = 'none';
          pathElement.style.clipPath = clipPathUrl;
          
          // Also set attributes as backup in case styles are reset
          pathElement.setAttribute('fill', fill);
          pathElement.setAttribute('stroke', 'none');
          pathElement.setAttribute('clip-path', clipPathUrl);
          
          // Only show toast for first time applications to reduce notification spam
          if (!toastShown.has(id)) {
            toastShown.add(id);
            toast.success('Floor plan applied successfully', { id: `floor-plan-${id}` });
          }
        });
        
        return true;
      } catch (err) {
        console.error('Error during image processing:', err);
        return false;
      }
    }
    
    // Start loading the image
    tempImg.src = imageUrlString;
    
    return true;
  } catch (err) {
    console.error('Error applying image clip mask:', err);
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
