
/**
 * Utilities for processing images in clip masks
 */
import { toast } from 'sonner';
import { loadingImages, toastShown } from './image-loading';
import { applyPatternAndClipPath } from './svg-elements';

/**
 * Calculates dimensions and positions for an image to fit within an SVG shape
 */
export const calculateImageFitDimensions = (
  bbox: SVGRect,
  imgWidth: number,
  imgHeight: number
): { 
  scaledWidth: number; 
  scaledHeight: number; 
  offsetX: number;
  offsetY: number;
} => {
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
  
  return { scaledWidth, scaledHeight, offsetX, offsetY };
};

/**
 * Loads and processes an image for a clip mask
 */
export const processImageForClipMask = (
  imageUrl: string,
  drawingId: string,
  pathElement: SVGPathElement,
  pattern: SVGPatternElement,
  onSuccess: () => void,
  onError: () => void
): void => {
  // Create an image element for the pattern
  const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  image.setAttribute('href', imageUrl);
  image.setAttribute('preserveAspectRatio', 'none'); // Don't preserve aspect ratio for better fitting
  
  // Add loading handler to ensure image is rendered properly
  image.onload = () => {
    console.log(`Pattern image loaded for drawing ${drawingId}`);
    
    // Remove loading class
    pathElement.classList.remove('loading-clip-mask');
    
    // Force a repaint after image loads
    window.dispatchEvent(new Event('resize'));
    
    // Set a success attribute
    pathElement.setAttribute('data-image-loaded', 'true');
    
    onSuccess();
  };
  
  // Add error handler
  image.onerror = (e) => {
    console.error(`Failed to load image for pattern-${drawingId}`, { imageUrl, error: e });
    pathElement.classList.remove('loading-clip-mask');
    pathElement.setAttribute('data-image-error', 'true');
    
    // Add a placeholder with error message
    image.setAttribute('href', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="red" font-size="14">Image failed</text></svg>');
    
    onError();
  };
  
  pattern.appendChild(image);
  
  // Get the bounding box to properly size the pattern
  const bbox = pathElement.getBBox();
  
  // Create a pre-loaded image to get dimensions
  const tempImg = new Image();
  
  // Set crossorigin attribute to handle CORS correctly
  tempImg.crossOrigin = "anonymous";
  
  // Add timeout to prevent hanging on image load
  const imageTimeout = setTimeout(() => {
    console.warn(`Image load timed out for ${drawingId}`);
    // Apply default dimensions if image load times out
    applyImageWithDimensions(300, 300);
    loadingImages.set(drawingId, false);
  }, 10000); // Longer timeout
  
  tempImg.onload = () => {
    clearTimeout(imageTimeout);
    console.log(`Image loaded successfully for ${drawingId}, dimensions: ${tempImg.width}x${tempImg.height}`);
    applyImageWithDimensions(tempImg.width, tempImg.height);
    loadingImages.set(drawingId, false);
  };
  
  tempImg.onerror = (e) => {
    clearTimeout(imageTimeout);
    console.error('Failed to load image for clip mask', e);
    console.error(`Image URL that failed: ${imageUrl}`);
    // Try to access the image URL to check if it's valid
    fetch(imageUrl)
      .then(res => {
        if (!res.ok) {
          console.error(`Image URL returned ${res.status} (${res.statusText})`);
        } else {
          console.log('Image URL seems valid, but loading failed for another reason');
        }
      })
      .catch(err => {
        console.error('Error accessing image URL:', err);
      });
    
    // Apply default dimensions as fallback
    applyImageWithDimensions(300, 300);
    loadingImages.set(drawingId, false);
  };
  
  function applyImageWithDimensions(imgWidth: number, imgHeight: number) {
    try {
      if (!pathElement || !document.contains(pathElement)) {
        console.error(`Path element for ${drawingId} is no longer in document`);
        return; // Safety check
      }
      
      // Log bounding box for debugging
      console.log(`BBox for ${drawingId}: x=${bbox.x}, y=${bbox.y}, w=${bbox.width}, h=${bbox.height}`);
      
      const { scaledWidth, scaledHeight, offsetX, offsetY } = calculateImageFitDimensions(
        bbox, imgWidth, imgHeight
      );
      
      // Set pattern attributes
      pattern.setAttribute('x', String(offsetX));
      pattern.setAttribute('y', String(offsetY));
      pattern.setAttribute('width', String(scaledWidth));
      pattern.setAttribute('height', String(scaledHeight));
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');
      
      // Update image dimensions
      image.setAttribute('width', String(scaledWidth));
      image.setAttribute('height', String(scaledHeight));
      image.setAttribute('x', '0');
      image.setAttribute('y', '0');
      
      // Only show toast for first time applications to reduce notification spam
      if (!toastShown.has(drawingId)) {
        toastShown.add(drawingId);
        toast.success('Floor plan applied successfully', { id: `floor-plan-${drawingId}` });
      }
      
      // Force a repaint to ensure the image renders
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
          detail: { drawingId: drawingId, refreshed: true } 
        }));
        
        // Double-check the visibility after a slight delay
        setTimeout(() => {
          if (pathElement && document.contains(pathElement)) {
            // Ensure fill is still applied
            if (!pathElement.style.fill || !pathElement.style.fill.includes(`url(#pattern-${drawingId})`)) {
              console.log(`Fill lost for ${drawingId}, reapplying`);
              pathElement.style.fill = `url(#pattern-${drawingId})`;
              pathElement.setAttribute('fill', `url(#pattern-${drawingId})`);
            }
          }
        }, 500);
      }, 100);
    } catch (err) {
      console.error('Error during image processing:', err);
      // Clear loading state
      if (pathElement) {
        pathElement.classList.remove('loading-clip-mask');
      }
      loadingImages.set(drawingId, false);
    }
  }
  
  // Start loading the image
  console.log(`Starting image load for ${drawingId} with URL: ${imageUrl}`);
  tempImg.src = imageUrl;
};
