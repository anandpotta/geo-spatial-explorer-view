
import { findSvgPathByDrawingId, applyImageClipMask, hasClipMaskApplied } from '@/utils/svg-clip-mask';
import { getFloorPlanById } from '@/utils/floor-plan-utils';
import L from 'leaflet';
import { toast } from 'sonner';

interface ApplyClipMaskOptions {
  drawingId: string;
  isMounted: boolean;
  layer: L.Layer;
}

/**
 * Applies a clip mask to a drawing with floor plan
 */
export const applyClipMaskToDrawing = ({ drawingId, isMounted, layer }: ApplyClipMaskOptions): void => {
  if (!drawingId || !isMounted) return;
  
  try {
    // Get the floor plan data
    const floorPlanData = getFloorPlanById(drawingId);
    if (!floorPlanData || !floorPlanData.data) {
      console.log(`No floor plan image found for drawing ${drawingId}`);
      return;
    }
    
    // Skip re-application check - first try to find the path
    const pathElement = findPathElement(drawingId, layer);
    if (pathElement && hasClipMaskApplied(pathElement)) {
      // If we found the path and it already has a clip mask, don't retry
      console.log(`Drawing ${drawingId} already has clip mask applied, skipping re-application`);
      return;
    }
    
    console.log(`Drawing ${drawingId} has a floor plan, will try to apply clip mask`);
    
    // Find the SVG path element with more reliable retries
    attemptApplyClipMask({
      drawingId,
      imageUrl: floorPlanData.data,
      isMounted,
      attempt: 1,
      maxAttempts: 5,
      initialDelay: 250,
      layer
    });
  } catch (err) {
    console.error('Error getting floor plan by ID:', err);
    toast.error('Failed to retrieve floor plan data');
  }
};

// Track application attempts to avoid repeated failures
const applicationAttempts = new Map<string, number>();

interface AttemptApplyClipMaskOptions {
  drawingId: string;
  imageUrl: string;
  isMounted: boolean;
  attempt: number;
  maxAttempts: number;
  initialDelay: number;
  layer: L.Layer;
}

/**
 * Attempts to apply a clip mask with retry logic
 */
const attemptApplyClipMask = ({ 
  drawingId, 
  imageUrl, 
  isMounted, 
  attempt, 
  maxAttempts, 
  initialDelay,
  layer
}: AttemptApplyClipMaskOptions): void => {
  if (!isMounted) return;
  
  // Check if we've had too many attempts recently
  const lastAttemptTime = applicationAttempts.get(drawingId) || 0;
  const currentTime = Date.now();
  
  // If we've tried too recently, delay longer
  if (currentTime - lastAttemptTime < 2000) {
    console.log(`Too many attempts for ${drawingId}, increasing delay`);
    setTimeout(() => {
      if (isMounted) {
        attemptApplyClipMask({
          drawingId,
          imageUrl,
          isMounted,
          attempt,
          maxAttempts,
          initialDelay: initialDelay * 2, // Double the delay
          layer
        });
      }
    }, initialDelay * 2);
    return;
  }
  
  // Update attempt tracking
  applicationAttempts.set(drawingId, currentTime);
  
  // Try multiple methods to find the path
  let pathElement = findPathElement(drawingId, layer);
  
  if (pathElement) {
    console.log(`Found path element for drawing ${drawingId} on attempt ${attempt}`);
    
    // Check if element already has clip mask to avoid reapplying
    if (hasClipMaskApplied(pathElement)) {
      console.log(`Path already has clip mask, skipping application for ${drawingId}`);
      return;
    }
    
    // Apply clip mask with stability optimization
    setTimeout(() => {
      if (isMounted) {
        // Final check that the path is still in the document and within an SVG before applying
        if (document.contains(pathElement) && pathElement.closest('svg')) {
          applyImageClipMask(pathElement, imageUrl, drawingId);
        } else {
          console.log(`Path element for ${drawingId} is no longer in the document or not in an SVG`);
          
          // Try to find the path again
          const newPathElement = findPathElement(drawingId, layer);
          if (newPathElement && document.contains(newPathElement) && newPathElement.closest('svg')) {
            applyImageClipMask(newPathElement, imageUrl, drawingId);
          }
        }
      }
    }, 10); // Small delay to ensure DOM is ready
  } else {
    // Log but don't show toast for retries
    console.log(`Path element not found for drawing ${drawingId}`);
    
    // Calculate exponential backoff delay with a maximum cap
    const nextDelay = Math.min(initialDelay * Math.pow(1.5, attempt - 1), 3000);
    
    if (attempt < maxAttempts && isMounted) {
      console.log(`Retrying to find path element for drawing ${drawingId} (Attempt ${attempt + 1} of ${maxAttempts}) in ${nextDelay}ms`);
      setTimeout(() => {
        // Check again before scheduling the next attempt
        const pathCheck = findPathElement(drawingId, layer);
        if (pathCheck && hasClipMaskApplied(pathCheck)) {
          console.log(`Path already has clip mask (discovered before retry), skipping for ${drawingId}`);
          return;
        }
        
        attemptApplyClipMask({
          drawingId,
          imageUrl,
          isMounted,
          attempt: attempt + 1,
          maxAttempts,
          initialDelay,
          layer
        });
      }, nextDelay);
    } else if (attempt >= maxAttempts) {
      // If we've reached max attempts but still want to try later
      // Add to a queue for retry after a longer delay
      setTimeout(() => {
        if (isMounted) {
          console.log(`Final attempt to find path for drawing ${drawingId}`);
          const lastPathElement = findPathElement(drawingId, layer);
          if (lastPathElement && !hasClipMaskApplied(lastPathElement)) {
            applyImageClipMask(lastPathElement, imageUrl, drawingId);
          }
        }
      }, 5000); // A longer delay for one last try
    }
  }
};

/**
 * Try multiple methods to find the path element
 */
const findPathElement = (drawingId: string, layer: L.Layer): SVGPathElement | null => {
  // First try direct access via Leaflet layer reference
  if (layer && (layer as any)._path) {
    return (layer as any)._path as SVGPathElement;
  }
  
  // Check each sublayer for the path element
  if (typeof (layer as any).eachLayer === 'function') {
    let foundPath: SVGPathElement | null = null;
    (layer as any).eachLayer((subLayer: L.Layer) => {
      if (!foundPath && (subLayer as any)._path) {
        foundPath = (subLayer as any)._path as SVGPathElement;
      }
    });
    if (foundPath) return foundPath;
  }

  // Use our utility function to search in the document
  const pathViaSelector = findSvgPathByDrawingId(drawingId);
  if (pathViaSelector) return pathViaSelector;
  
  // Search in the overlay pane for paths with attributes or classes matching our drawing ID
  try {
    // Try to find the map container
    const map = (layer as any)._map;
    if (map) {
      const container = map.getContainer();
      const overlayPane = container?.querySelector('.leaflet-overlay-pane');
      if (overlayPane) {
        // Try to find the specific path by its attributes
        const pathById = overlayPane.querySelector(`#drawing-path-${drawingId}`);
        if (pathById) return pathById as SVGPathElement;
        
        const pathByAttr = overlayPane.querySelector(`path[data-drawing-id="${drawingId}"]`);
        if (pathByAttr) return pathByAttr as SVGPathElement;
        
        const pathByClass = overlayPane.querySelector(`.drawing-path-${drawingId.substring(0, 8)}`);
        if (pathByClass) return pathByClass as SVGPathElement;
        
        // If we have exactly one path and this is a retry, it might be the one we're looking for
        const allPaths = overlayPane.querySelectorAll('path.leaflet-interactive');
        if (allPaths.length === 1) {
          return allPaths[0] as SVGPathElement;
        }
      }
    }
  } catch (err) {
    console.error('Error finding path element:', err);
  }
  
  return null;
};
