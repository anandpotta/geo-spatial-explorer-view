
/**
 * Core functionality for applying clip masks to SVG elements
 */
import { storeOriginalAttributes } from './clip-mask-attributes';
import { hasClipMaskApplied } from './clip-mask-checker';
import { showClipMaskSuccessToast, showClipMaskErrorToast } from './clip-mask-toast';
import { calculateImagePlacement, createPatternWithImage } from './clip-mask-image';
import { createClipPath, cleanupExistingElements, applyClipPathAndFill } from './clip-mask-path';

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
    // Debug check
    console.log('Applying image clip mask to path', id, typeof imageUrl);
    
    // Ensure imageUrl is a string before attempting to use string methods
    const imageUrlString = typeof imageUrl === 'string' ? imageUrl : 
      (typeof imageUrl === 'object' && imageUrl !== null ? JSON.stringify(imageUrl) : '');
    
    if (!imageUrlString) {
      console.error('Invalid image URL format');
      return false;
    }
    
    // Check if already has clip mask (improved check)
    if (hasClipMaskApplied(pathElement)) {
      console.log('Path already has clip mask, updating timestamp');
      pathElement.setAttribute('data-last-updated', Date.now().toString());
      
      // Even if it has a clip mask, we should update the image - the old one might be stale
      if (!pathElement.getAttribute('clip-path') || !pathElement.style.fill) {
        console.log('Clip mask exists but attributes missing, reapplying');
      } else {
        // If everything looks good, just return - no need to reapply
        return true;
      }
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
    
    console.log('Found path data:', pathData.substring(0, 20) + '...');
    
    // Store original path data and style for potential restoration
    storeOriginalAttributes(pathElement);
    
    // Create the defs section if it doesn't exist
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);
    }
    
    // Clean up any existing elements with the same IDs first
    cleanupExistingElements(defs, id);
    
    // Create a clip path element
    createClipPath(defs, id, pathData);
    
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
      console.log(`Image loaded successfully: ${tempImg.width}x${tempImg.height}`);
      applyImageWithDimensions(tempImg.width, tempImg.height);
    };
    
    tempImg.onerror = (e) => {
      clearTimeout(imageTimeout);
      console.error('Failed to load image for clip mask', e);
      // Don't show error toasts for image load errors to reduce spam
      // Apply default dimensions as fallback
      applyImageWithDimensions(300, 300);
    };
    
    // Function to apply the image with known dimensions
    function applyImageWithDimensions(imgWidth: number, imgHeight: number) {
      try {
        if (!svg || !pathElement || !document.contains(pathElement) || !defs) {
          console.error('Elements no longer in DOM, cannot apply clip mask');
          return false;
        }
        
        // Get the bounding box to properly size the pattern
        const bbox = pathElement.getBBox();
        console.log(`Path bounding box: ${bbox.x},${bbox.y} ${bbox.width}x${bbox.height}`);
        
        // Calculate placement for the image
        const placement = calculateImagePlacement(bbox, imgWidth, imgHeight);
        
        // Create pattern and image elements
        const { pattern, image } = createPatternWithImage(
          defs, 
          id, 
          imageUrlString, 
          placement.offsetX, 
          placement.offsetY, 
          placement.scaledWidth, 
          placement.scaledHeight
        );
        
        // Set default values for transformation
        pathElement.setAttribute('data-image-rotation', '0');
        pathElement.setAttribute('data-image-scale', '1');
        pathElement.setAttribute('data-image-offset-x', '0');
        pathElement.setAttribute('data-image-offset-y', '0');
        
        // Apply the clip path and fill
        applyClipPathAndFill(pathElement, id);
        
        // Force a redraw
        svg.style.display = 'none';
        svg.offsetHeight; // Force reflow
        svg.style.display = '';
        
        // Show success toast (only once per drawing)
        showClipMaskSuccessToast(id);
        
        // Dispatch an event to notify that the clip mask was updated
        window.dispatchEvent(new CustomEvent('clipMaskUpdated', {
          detail: { drawingId: id }
        }));
        
        return true;
      } catch (err) {
        console.error('Error during image processing:', err);
        return false;
      }
    }
    
    console.log(`Starting image load for ${imageUrlString.substring(0, 50)}...`);
    // Start loading the image
    tempImg.src = imageUrlString;
    
    return true;
  } catch (err) {
    console.error('Error applying image clip mask:', err);
    showClipMaskErrorToast('Failed to apply floor plan to drawing');
    return false;
  }
};
