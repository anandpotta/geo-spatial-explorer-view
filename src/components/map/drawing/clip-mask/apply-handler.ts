
/**
 * Core functionality for applying clip masks
 */
import { toast } from 'sonner';
import { getFloorPlanById } from '@/utils/floor-plan-utils';
import { hasClipMaskApplied, applyImageClipMask } from '@/utils/svg-clip-mask';
import { ApplyClipMaskOptions, ApplyWithStabilityOptions } from './types';
import { findPathElement, generateElementIdentifier } from './element-utils';
import { 
  applicationAttempts, 
  lastApplicationTime, 
  clipMaskCache, 
  elementIdentifiers 
} from './cache-manager';

/**
 * Apply clip mask with improved stability
 */
export const applyWithStability = ({ drawingId, imageUrl, pathElement, isMounted }: ApplyWithStabilityOptions): void => {
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
      clipMaskCache.set(drawingId, true);
    }
  }, 50);
};

/**
 * Applies a clip mask to a drawing with floor plan
 */
export const applyClipMaskToDrawing = async ({ drawingId, isMounted, layer }: ApplyClipMaskOptions): Promise<void> => {
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
    
    // Get the floor plan data - await the promise
    const floorPlanData = await getFloorPlanById(drawingId);
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
