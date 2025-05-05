
/**
 * Core functionality for applying clip masks to SVG elements
 */
import { toast } from 'sonner';
import { storeOriginalAttributes } from './clip-mask-attributes';
import { hasClipMaskApplied } from './clip-mask-checker';
import { getCurrentUser } from '@/services/auth-service';

// Track which drawings have been displayed with toasts to avoid duplicates
const toastShown = new Set<string>();
// Track images that are currently loading
const loadingImages = new Map<string, boolean>();

/**
 * Creates and applies an SVG clip mask with an image to a path element
 */
export const applyImageClipMask = (
  pathElement: SVGPathElement | null, 
  imageUrl: string | object | null | undefined, 
  id: string
): boolean => {
  if (!pathElement || !imageUrl) {
    console.error('Cannot apply clip mask: missing path or image URL', {pathElement, imageUrl});
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
    
    // Log debugging info
    console.log(`Applying clip mask for drawing ${id}`);
    console.log(`Path element:`, pathElement);
    
    // Ensure imageUrl is a string before attempting to use string methods
    const imageUrlString = typeof imageUrl === 'string' ? imageUrl : 
      (typeof imageUrl === 'object' && imageUrl !== null ? JSON.stringify(imageUrl) : '');
    
    if (!imageUrlString) {
      console.error('Invalid image URL format');
      loadingImages.set(id, false);
      return false;
    }
    
    console.log(`Using image URL: ${imageUrlString}`);
    
    // Check if already has clip mask (improved check)
    if (hasClipMaskApplied(pathElement)) {
      console.log(`Path already has clip mask for ${id}, updating attributes`);
      // Just update timestamp to trigger a refresh
      pathElement.setAttribute('data-last-updated', Date.now().toString());
      loadingImages.set(id, false);
      return true;
    }
    
    // Get the SVG element that contains this path
    const svg = pathElement.closest('svg');
    if (!svg) {
      console.error('SVG path is not within an SVG element');
      loadingImages.set(id, false);
      return false;
    }
    
    // Get the path data
    const pathData = pathElement.getAttribute('d');
    if (!pathData) {
      console.error('SVG path has no path data (d attribute)');
      loadingImages.set(id, false);
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
    pathElement.setAttribute('data-user-id', currentUser.id);
    
    // Add a visible outline to help see the path
    pathElement.classList.add('visible-path-stroke');
    
    // Set a loading class to indicate that an image is being loaded
    pathElement.classList.add('loading-clip-mask');
    
    // Create a pre-loaded image to get dimensions
    const tempImg = new Image();
    
    // Set crossorigin attribute to handle CORS correctly
    tempImg.crossOrigin = "anonymous";
    
    // Add timeout to prevent hanging on image load
    const imageTimeout = setTimeout(() => {
      console.warn(`Image load timed out for ${id}`);
      // Apply default dimensions if image load times out
      applyImageWithDimensions(300, 300);
      loadingImages.set(id, false);
    }, 10000); // Longer timeout
    
    tempImg.onload = () => {
      clearTimeout(imageTimeout);
      console.log(`Image loaded successfully for ${id}, dimensions: ${tempImg.width}x${tempImg.height}`);
      applyImageWithDimensions(tempImg.width, tempImg.height);
      loadingImages.set(id, false);
    };
    
    tempImg.onerror = (e) => {
      clearTimeout(imageTimeout);
      console.error('Failed to load image for clip mask', e);
      // Apply default dimensions as fallback
      applyImageWithDimensions(300, 300);
      loadingImages.set(id, false);
    };
    
    // Function to apply the image with known dimensions
    function applyImageWithDimensions(imgWidth: number, imgHeight: number) {
      try {
        if (!svg || !pathElement || !document.contains(pathElement)) {
          console.error(`Path element for ${id} is no longer in document`);
          return; // Safety check
        }
        
        // Get the bounding box to properly size the pattern
        const bbox = pathElement.getBBox();
        
        // Log bounding box for debugging
        console.log(`BBox for ${id}: x=${bbox.x}, y=${bbox.y}, w=${bbox.width}, h=${bbox.height}`);
        
        // Calculate scale to fit the image properly within the shape
        // Use a different scaling approach to ensure image covers the entire shape
        const scaleX = bbox.width / imgWidth;
        const scaleY = bbox.height / imgHeight;
        const scale = Math.max(scaleX, scaleY) * 1.05; // 5% extra coverage to avoid gaps
        
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        
        // Calculate position to exactly center the image in the path
        const offsetX = bbox.x + (bbox.width - scaledWidth) / 2;
        const offsetY = bbox.y + (bbox.height - scaledHeight) / 2;
        
        // Create a pattern for the image with calculated dimensions
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', `pattern-${id}`);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        pattern.setAttribute('x', String(offsetX));
        pattern.setAttribute('y', String(offsetY));
        pattern.setAttribute('width', String(scaledWidth));
        pattern.setAttribute('height', String(scaledHeight));
        pattern.setAttribute('preserveAspectRatio', 'none');
        defs.appendChild(pattern);
        
        // Create an image element for the pattern
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', imageUrlString);
        image.setAttribute('width', String(scaledWidth));
        image.setAttribute('height', String(scaledHeight));
        image.setAttribute('x', '0');
        image.setAttribute('y', '0');
        image.setAttribute('preserveAspectRatio', 'none'); // Don't preserve aspect ratio for better fitting
        
        // Add loading handler to ensure image is rendered properly
        image.onload = () => {
          console.log(`Pattern image loaded for drawing ${id}`);
          
          // Remove loading class
          pathElement.classList.remove('loading-clip-mask');
          
          // Force a repaint after image loads
          window.dispatchEvent(new Event('resize'));
          
          // Set a success attribute
          pathElement.setAttribute('data-image-loaded', 'true');
        };
        
        // Add error handler
        image.onerror = () => {
          console.error(`Failed to load image for pattern-${id}`, { imageUrlString });
          pathElement.classList.remove('loading-clip-mask');
          pathElement.setAttribute('data-image-error', 'true');
          
          // Add a placeholder with error message
          image.setAttribute('href', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="red" font-size="14">Image failed</text></svg>');
        };
        
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
          
          console.log(`Setting fill to: ${fill}`);
          console.log(`Setting clip-path to: ${clipPathUrl}`);
          
          // Set fill first
          pathElement.style.fill = fill;
          pathElement.setAttribute('fill', fill);
          
          // Then apply clip path
          pathElement.style.clipPath = clipPathUrl;
          pathElement.setAttribute('clip-path', clipPathUrl);
          
          // Add extra visibility classes
          pathElement.classList.add('has-image-fill');
          
          // Only show toast for first time applications to reduce notification spam
          if (!toastShown.has(id)) {
            toastShown.add(id);
            toast.success('Floor plan applied successfully', { id: `floor-plan-${id}` });
          }
          
          // Force a repaint to ensure the image renders
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
              detail: { drawingId: id, refreshed: true } 
            }));
            
            // Double-check the visibility after a slight delay
            setTimeout(() => {
              if (pathElement && document.contains(pathElement)) {
                // Ensure fill is still applied
                if (!pathElement.style.fill || !pathElement.style.fill.includes(`url(#pattern-${id})`)) {
                  console.log(`Fill lost for ${id}, reapplying`);
                  pathElement.style.fill = fill;
                  pathElement.setAttribute('fill', fill);
                }
              }
            }, 500);
          }, 100);
        });
        
        return true;
      } catch (err) {
        console.error('Error during image processing:', err);
        // Clear loading state
        if (pathElement) {
          pathElement.classList.remove('loading-clip-mask');
        }
        loadingImages.set(id, false);
        return false;
      }
    }
    
    // Start loading the image
    console.log(`Starting image load for ${id} with URL: ${imageUrlString}`);
    tempImg.src = imageUrlString;
    
    return true;
  } catch (err) {
    console.error('Error applying image clip mask:', err);
    loadingImages.set(id, false);
    return false;
  }
};

// Add global styles for clip mask elements
if (typeof document !== 'undefined') {
  // Add styles to document
  const style = document.createElement('style');
  style.innerHTML = `
    .visible-path-stroke {
      stroke-width: 4px !important;
      stroke: #33C3F0 !important;
      stroke-opacity: 1 !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
      fill-opacity: 1 !important;
      vector-effect: non-scaling-stroke;
      pointer-events: auto !important;
    }
    
    .loading-clip-mask {
      stroke-dasharray: 4 !important;
      animation: dash 1.5s linear infinite !important;
    }
    
    .has-image-fill {
      fill-opacity: 1 !important;
    }
    
    @keyframes dash {
      to {
        stroke-dashoffset: 8;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Reset the toast tracking when the page reloads
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    toastShown.clear();
    loadingImages.clear();
  });
}
