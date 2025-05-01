
/**
 * Core functionality for applying clip masks to SVG elements
 */
import { toast } from 'sonner';
import { storeOriginalAttributes } from './clip-mask-attributes';
import { hasClipMaskApplied } from './clip-mask-checker';

/**
 * Creates and applies an SVG clip mask with an image to a path element
 */
export const applyImageClipMask = (
  pathElement: SVGPathElement | null, 
  imageUrl: string | object | null | undefined, 
  id: string
): boolean => {
  if (!pathElement || !imageUrl) {
    console.error('Cannot apply clip mask: missing path or image URL');
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
    
    // Safe logging that won't cause errors with any imageUrl type
    console.log(`Applying clip mask for drawing ${id} with image URL type: ${typeof imageUrl}`);
    
    // Check if already has clip mask (improved check)
    if (hasClipMaskApplied(pathElement)) {
      console.log(`Path for drawing ${id} already has clip mask, skipping application`);
      return true;
    }
    
    // Get the SVG element that contains this path
    const svg = pathElement.closest('svg');
    if (!svg) {
      // Log error and wait for next render cycle
      console.error('SVG path is not within an SVG element');
      
      // Schedule a retry with a short delay to see if SVG becomes available
      setTimeout(() => {
        const retryPath = document.querySelector(`path[data-drawing-id="${id}"]`) as SVGPathElement;
        if (retryPath && retryPath.closest('svg')) {
          console.log(`SVG became available for drawing ${id}, retrying clip mask`);
          applyImageClipMask(retryPath, imageUrl, id);
        }
      }, 500);
      
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
    let clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', `clip-${id}`);
    defs.appendChild(clipPath);
    
    // Create a path for the clip path
    const clipPathPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    clipPathPath.setAttribute('d', pathData);
    clipPath.appendChild(clipPathPath);
    
    // Load the image to get its dimensions before creating the pattern
    const tempImg = new Image();
    tempImg.onload = () => {
      try {
        if (!svg || !pathElement) return; // Safety check
        
        // Get the bounding box to properly size the pattern
        const bbox = pathElement.getBBox();
        
        // Calculate scale to fit the image properly within the shape
        const imgWidth = tempImg.width;
        const imgHeight = tempImg.height;
        
        const scaleX = bbox.width / imgWidth;
        const scaleY = bbox.height / imgHeight;
        const scale = Math.max(scaleX, scaleY); // Use max to ensure image covers the shape
        
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        
        // Calculate position to center the image
        const offsetX = (bbox.width - scaledWidth) / 2 + bbox.x;
        const offsetY = (bbox.height - scaledHeight) / 2 + bbox.y;
        
        // Create a pattern for the image with calculated dimensions
        let pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
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
        
        // Apply changes in a single batch using RAF to reduce visual flickering
        requestAnimationFrame(() => {
          if (!pathElement) return; // Safety check
          
          // Mark as having clip mask first (prevents race conditions)
          pathElement.setAttribute('data-has-clip-mask', 'true');
          pathElement.setAttribute('data-last-updated', Date.now().toString());
          
          // Apply pattern fill first
          pathElement.setAttribute('fill', `url(#pattern-${id})`);
          
          // Remove stroke for better appearance
          pathElement.setAttribute('stroke', 'none');
          
          // Apply clip path after a small delay to reduce flicker
          setTimeout(() => {
            if (pathElement) {
              pathElement.setAttribute('clip-path', `url(#clip-${id})`);
              toast.success('Floor plan applied successfully');
            }
          }, 20);
        });
      } catch (err) {
        console.error('Error during image processing:', err);
        toast.error('Error processing floor plan image');
      }
    };
    
    tempImg.onerror = () => {
      console.error('Failed to load image for clip mask');
      toast.error('Failed to load image for floor plan');
    };
    
    // Start loading the image
    tempImg.src = imageUrlString;
    
    return true;
  } catch (err) {
    console.error('Error applying image clip mask:', err);
    toast.error('Failed to apply floor plan image');
    return false;
  }
};
