
import { findSvgPathByDrawingId, applyImageClipMask, hasClipMaskApplied } from '@/utils/svg-clip-mask';
import { getFloorPlanById } from '@/utils/floor-plan-utils';
import L from 'leaflet';
import { toast } from 'sonner';

interface ApplyClipMaskOptions {
  drawingId: string;
  isMounted: boolean;
  layer: L.Layer;
}

// Track application attempts to avoid repeated failures
const applicationAttempts = new Map<string, number>();
// Track successful applications to avoid reapplying
const successfulApplications = new Map<string, boolean>();
// Track the last time we tried to apply a mask to a drawing
const lastApplicationTime = new Map<string, number>();

/**
 * Applies a clip mask to a drawing with floor plan
 */
export const applyClipMaskToDrawing = ({ drawingId, isMounted, layer }: ApplyClipMaskOptions): void => {
  if (!drawingId || !isMounted) return;
  
  try {
    // Check if we've recently tried to apply a mask to this drawing
    const now = Date.now();
    const lastTime = lastApplicationTime.get(drawingId) || 0;
    const timeSinceLastAttempt = now - lastTime;
    
    // If we've tried within the last 3 seconds, skip this attempt
    if (timeSinceLastAttempt < 3000) {
      console.log(`Skipping clip mask application for ${drawingId}, attempted too recently (${timeSinceLastAttempt}ms ago)`);
      return;
    }
    
    // Update the timestamp of our attempt
    lastApplicationTime.set(drawingId, now);
    
    // Check if we've already successfully applied a mask to this drawing
    if (successfulApplications.get(drawingId)) {
      console.log(`Clip mask already successfully applied to ${drawingId}, skipping`);
      
      // Check if the element still exists and has the mask
      const pathElement = findPathElement(drawingId, layer);
      if (pathElement && hasClipMaskApplied(pathElement)) {
        // Everything is good, no need to reapply
        return;
      } else {
        // Path changed or mask was lost, need to reapply
        console.log(`Path element changed or mask lost for ${drawingId}, will reapply`);
        successfulApplications.set(drawingId, false);
      }
    }
    
    // Get the floor plan data
    const floorPlanData = getFloorPlanById(drawingId);
    if (!floorPlanData || !floorPlanData.data) {
      console.log(`No floor plan image found for drawing ${drawingId}`);
      return;
    }
    
    console.log(`Drawing ${drawingId} has a floor plan, will try to apply clip mask`);
    
    // Find the SVG path element with more reliable retries
    attemptApplyClipMask({
      drawingId,
      imageUrl: floorPlanData.data,
      isMounted,
      attempt: 1,
      maxAttempts: 3, // Reduce max attempts to prevent too many failures
      initialDelay: 150,
      layer
    });
  } catch (err) {
    console.error('Error getting floor plan by ID:', err);
    // Don't show toast for errors to reduce notification spam
  }
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
  
  // Check if we've had too many attempts recently
  const lastAttemptTime = applicationAttempts.get(drawingId) || 0;
  const currentTime = Date.now();
  
  // If we've tried too recently, delay longer
  if (currentTime - lastAttemptTime < 1000) {
    setTimeout(() => {
      if (isMounted) {
        attemptApplyClipMask({
          drawingId,
          imageUrl,
          isMounted,
          attempt,
          maxAttempts,
          initialDelay: initialDelay * 1.5, // Increase delay
          layer
        });
      }
    }, initialDelay * 1.5);
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
      successfulApplications.set(drawingId, true);
      return;
    }
    
    // Apply clip mask with stability optimization
    setTimeout(() => {
      if (!isMounted) return;
      
      // Final check that the path is still in the document and within an SVG before applying
      if (document.contains(pathElement) && pathElement.closest('svg')) {
        const success = applyImageClipMask(pathElement, imageUrl, drawingId);
        if (success) {
          successfulApplications.set(drawingId, true);
        }
      } else {
        console.log(`Path element for ${drawingId} is no longer in the document or not in an SVG`);
        
        // Try to find the path again
        const newPathElement = findPathElement(drawingId, layer);
        if (newPathElement && document.contains(newPathElement) && newPathElement.closest('svg')) {
          const success = applyImageClipMask(newPathElement, imageUrl, drawingId);
          if (success) {
            successfulApplications.set(drawingId, true);
          }
        }
      }
    }, 10); // Small delay to ensure DOM is ready
  } else if (attempt < maxAttempts && isMounted) {
    // Calculate exponential backoff delay with a maximum cap
    const nextDelay = Math.min(initialDelay * Math.pow(1.5, attempt - 1), 1000);
    
    setTimeout(() => {
      // Check again before scheduling the next attempt
      if (!isMounted) return;
      
      const pathCheck = findPathElement(drawingId, layer);
      if (pathCheck && hasClipMaskApplied(pathCheck)) {
        successfulApplications.set(drawingId, true);
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
