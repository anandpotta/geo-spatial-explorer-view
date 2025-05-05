
/**
 * Core functionality for applying clip masks to SVG elements
 * This file coordinates the clip mask application process using
 * functionality from the core modules
 */
import { hasClipMaskApplied } from './clip-mask-checker';
import { 
  loadingImages, 
  toastShown,
  storeImageUrl 
} from './core/image-loading';
import { getCurrentUser } from '@/services/auth-service';
import { 
  resolveImageUrl, 
  getDefaultImageUrl 
} from './core/url-handling';
import { createClipMaskSvgElements, applyPatternAndClipPath } from './core/svg-elements';
import { preparePathForClipMask } from './core/attributes';
import { processImageForClipMask } from './core/image-processing';

// Import styles
import './core/styles';

/**
 * Creates and applies an SVG clip mask with an image to a path element
 */
export const applyImageClipMask = (
  pathElement: SVGPathElement | null, 
  imageUrl: string | object | null | undefined, 
  id: string
): boolean => {
  if (!pathElement) {
    console.error('Cannot apply clip mask: missing path element');
    return false;
  }
  
  // Get current user
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot apply clip mask: user not logged in');
    return false;
  }
  
  // If already loading this image, don't start another load
  if (loadingImages.get(id)) {
    console.log(`Already loading image for ${id}, skipping duplicate request`);
    return true;
  }
  
  try {
    // Set loading state
    loadingImages.set(id, true);
    
    // Add loading indicator class to path
    pathElement.classList.add('loading-clip-mask');
    
    // Log debugging info
    console.log(`Applying clip mask for drawing ${id}`);
    console.log(`Path element:`, pathElement);
    
    // Resolve the image URL
    let imageUrlString = resolveImageUrl(imageUrl, id);
    if (!imageUrlString) {
      // If still no URL, use a default placeholder pattern
      console.log(`No image URL found, using default pattern for ${id}`);
      imageUrlString = getDefaultImageUrl(id);
      
      if (!imageUrlString) {
        console.error(`Could not create default URL for ${id}`);
        loadingImages.set(id, false);
        pathElement.classList.remove('loading-clip-mask');
        return false;
      }
      
      // Store this default URL so we can reference it later
      storeImageUrl(id, imageUrlString, 'default-pattern');
    }
    
    console.log(`Using image URL: ${imageUrlString}`);
    
    // Check if already has clip mask (improved check)
    if (hasClipMaskApplied(pathElement)) {
      console.log(`Path already has clip mask for ${id}, updating attributes`);
      // Just update timestamp to trigger a refresh
      pathElement.setAttribute('data-last-updated', Date.now().toString());
      pathElement.setAttribute('data-has-clip-mask', 'true');
      loadingImages.set(id, false);
      pathElement.classList.remove('loading-clip-mask');
      
      // Ensure the fill is still properly applied
      const patternId = `pattern-${id}`;
      const fill = `url(#${patternId})`;
      pathElement.style.fill = fill;
      pathElement.setAttribute('fill', fill);
      
      // Force a repaint
      requestAnimationFrame(() => {
        if (pathElement && document.contains(pathElement)) {
          pathElement.getBoundingClientRect();
          window.dispatchEvent(new Event('resize'));
        }
      });
      
      return true;
    }
    
    // Get the SVG element that contains this path
    const svg = pathElement.closest('svg');
    if (!svg) {
      console.error('SVG path is not within an SVG element');
      loadingImages.set(id, false);
      pathElement.classList.remove('loading-clip-mask');
      return false;
    }
    
    // Create SVG elements for clip mask
    const elements = createClipMaskSvgElements(svg, pathElement, id);
    if (!elements) {
      console.error('Failed to create SVG elements for clip mask');
      loadingImages.set(id, false);
      pathElement.classList.remove('loading-clip-mask');
      return false;
    }
    const { clipPath, pattern } = elements;
    
    // Prepare the path element with necessary attributes
    preparePathForClipMask(pathElement, id);
    
    // Process the image for the clip mask
    processImageForClipMask(
      imageUrlString,
      id,
      pathElement,
      pattern,
      // Success callback
      () => {
        // Apply the pattern and clip path
        console.log(`Applying pattern and clip path for ${id}`);
        applyPatternAndClipPath(pathElement, `pattern-${id}`, `clip-${id}`);
        
        // Mark as having a clip mask
        pathElement.setAttribute('data-has-clip-mask', 'true');
        pathElement.setAttribute('data-image-url', typeof imageUrl === 'string' ? imageUrl : imageUrlString);
        
        // Remove loading class
        pathElement.classList.remove('loading-clip-mask');
        
        // Store the URL for future reference if it's not already stored
        if (typeof imageUrl === 'string' && imageUrl.startsWith('blob:')) {
          storeImageUrl(id, imageUrl);
        }
        
        // Force a repaint to ensure changes are rendered
        requestAnimationFrame(() => {
          if (pathElement && document.contains(pathElement)) {
            pathElement.getBoundingClientRect();
            window.dispatchEvent(new Event('resize'));
            // Trigger a custom event that the floor plan was updated
            window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
              detail: { drawingId: id }
            }));
          }
        });
      },
      // Error callback
      () => {
        // Error handled in processImageForClipMask
        console.error('Error in image processing callback');
        pathElement.classList.remove('loading-clip-mask');
        loadingImages.set(id, false);
      }
    );
    
    return true;
  } catch (err) {
    console.error('Error applying image clip mask:', err);
    if (pathElement) {
      pathElement.classList.remove('loading-clip-mask');
    }
    loadingImages.set(id, false);
    return false;
  }
};
