
import { findSvgPathByDrawingId, applyImageClipMask, hasClipMaskApplied } from '@/utils/svg-clip-mask';
import { getFloorPlanImageUrl } from '@/utils/floor-plan-utils';
import L from 'leaflet';

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
  
  // Get the floor plan image URL
  const imageUrl = getFloorPlanImageUrl(drawingId);
  if (!imageUrl) {
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
    imageUrl,
    isMounted,
    attempt: 1,
    maxAttempts: 10, // Reduced from 15 to 10 to avoid excessive attempts
    initialDelay: 250,
    layer
  });
};

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
        applyImageClipMask(pathElement, imageUrl, drawingId);
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
  
  // Search in the overlay pane for paths
  // Fix: Only use _map property with type assertion
  const map = (layer as any)._map;
  if (map) {
    const container = map.getContainer();
    const overlayPane = container?.querySelector('.leaflet-overlay-pane');
    if (overlayPane) {
      const paths = overlayPane.querySelectorAll('path.leaflet-interactive');
      
      // Try to find by ID or class first
      const pathById = overlayPane.querySelector(`#drawing-path-${drawingId}`);
      if (pathById) return pathById as SVGPathElement;
      
      const pathByClass = overlayPane.querySelector(`.drawing-path-${drawingId.substring(0, 8)}`);
      if (pathByClass) return pathByClass as SVGPathElement;
      
      // If we have exactly one path, it might be the one we're looking for
      if (paths.length === 1) {
        return paths[0] as SVGPathElement;
      }
    }
  }
  
  return null;
};
