
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
// Cache to store which paths already have masks applied
const clipMaskCache = new Map<string, boolean>();
// Track element identifiers to detect if the actual element has changed
const elementIdentifiers = new Map<string, string>();

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
    
    // If we've tried within the last 5 seconds, skip this attempt - increased from 3 to 5 seconds
    if (timeSinceLastAttempt < 5000) {
      console.log(`Skipping clip mask application for ${drawingId}, attempted too recently (${timeSinceLastAttempt}ms ago)`);
      return;
    }
    
    // Update the timestamp of our attempt
    lastApplicationTime.set(drawingId, now);
    
    // Get the floor plan data
    const floorPlanData = getFloorPlanById(drawingId);
    if (!floorPlanData || !floorPlanData.data) {
      console.log(`No floor plan image found for drawing ${drawingId}`);
      return;
    }
    
    // Find the SVG path element
    const pathElement = findPathElement(drawingId, layer);
    
    // If no path element, no point continuing
    if (!pathElement) {
      console.log(`Could not find path element for drawing ${drawingId}`);
      return;
    }
    
    // Generate a unique identifier for this path element to detect changes
    const elementId = generateElementIdentifier(pathElement);
    const previousElementId = elementIdentifiers.get(drawingId);
    
    // Check if the element has changed (different DOM node)
    let elementChanged = previousElementId !== elementId;
    if (elementChanged) {
      elementIdentifiers.set(drawingId, elementId);
      clipMaskCache.delete(drawingId);
    }
    
    // Check if this path already has a clip mask
    if (hasClipMaskApplied(pathElement)) {
      // Update the cache
      clipMaskCache.set(drawingId, true);
      
      // Check if we previously recorded this as having a mask
      if (!elementChanged && clipMaskCache.get(drawingId)) {
        console.log(`Path already has clip mask, skipping application for ${drawingId}`);
        return;
      }
    } else {
      // Mark this as not having a mask in the cache
      clipMaskCache.set(drawingId, false);
    }
    
    console.log(`Drawing ${drawingId} needs clip mask application, proceeding`);
    
    // Apply the clip mask with more stability
    applyWithStability({
      drawingId,
      imageUrl: floorPlanData.data,
      pathElement,
      isMounted
    });
  } catch (err) {
    console.error('Error applying clip mask to drawing:', err);
  }
};

/**
 * Generate a unique identifier for an element to track if it's been replaced
 */
const generateElementIdentifier = (element: SVGPathElement): string => {
  const attributes = Array.from(element.attributes)
    .map(attr => `${attr.name}=${attr.value}`)
    .join(';');
  
  // Include parent info for more reliable identification
  const parentId = element.parentElement?.id || '';
  const pathData = element.getAttribute('d') || '';
  
  return `${parentId}-${attributes}-${pathData.substring(0, 20)}`;
};

interface ApplyWithStabilityOptions {
  drawingId: string;
  imageUrl: string;
  pathElement: SVGPathElement;
  isMounted: boolean;
}

/**
 * Apply clip mask with improved stability
 */
const applyWithStability = ({ drawingId, imageUrl, pathElement, isMounted }: ApplyWithStabilityOptions): void => {
  if (!pathElement || !isMounted) return;
  
  // Safety check: ensure path is still in the document
  if (!document.contains(pathElement)) {
    console.log(`Path element for ${drawingId} is no longer in the document`);
    return;
  }
  
  // Safety check: make sure path is within an SVG
  if (!pathElement.closest('svg')) {
    console.log(`Path element for ${drawingId} is not within an SVG`);
    return;
  }
  
  // Update application tracking
  applicationAttempts.set(drawingId, Date.now());
  
  // Apply the mask within a stability wrapper
  setTimeout(() => {
    if (!isMounted) return;
    
    // Final safety check
    if (!document.contains(pathElement) || !pathElement.closest('svg')) {
      return;
    }
    
    // Apply the clip mask
    const success = applyImageClipMask(pathElement, imageUrl, drawingId);
    
    // Update tracking on success
    if (success) {
      successfulApplications.set(drawingId, true);
      clipMaskCache.set(drawingId, true);
    }
  }, 50);
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

// Reset clip mask cache when window visibility changes
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Clear caches when tab becomes visible again
      clipMaskCache.clear();
      elementIdentifiers.clear();
    }
  });
}
