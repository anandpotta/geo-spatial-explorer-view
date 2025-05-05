
/**
 * Handles applying clip masks to SVG path elements
 */
import { findPathElement } from './element-utils';
import { 
  applicationAttempts,
  successfulApplications,
  lastApplicationTime,
  clipMaskCache,
  elementIdentifiers
} from './cache-manager';
import { generateElementIdentifier } from './element-utils';
import { toast } from 'sonner';
import L from 'leaflet';
import { applyImageClipMask, findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
import { hasFloorPlan } from '@/utils/floor-plan-utils';

export interface ApplyClipMaskOptions {
  drawingId: string;
  layer: L.Layer;
  imageUrl?: string; // Optional imageUrl
  retryOnFailure?: boolean;
  isMounted?: boolean;
}

export interface ApplyWithStabilityOptions extends ApplyClipMaskOptions {
  stabilityWaitTime?: number;
  maxRetries?: number;
}

// Track the last time a clip mask was applied to any drawing
let lastGlobalApplyTime = 0;
const GLOBAL_RATE_LIMIT = 2000; // 2 seconds between apply attempts globally

/**
 * Apply a clip mask to an SVG path element, with debouncing and rate limiting
 * Returns a Promise that resolves to true if successful, false otherwise
 */
export const applyClipMaskToDrawing = async ({
  drawingId, 
  layer, 
  imageUrl, 
  retryOnFailure = true,
  isMounted = true,
  stabilityWaitTime = 500,
  maxRetries = 3
}: ApplyWithStabilityOptions): Promise<boolean> => {
  // Skip if component is no longer mounted
  if (!isMounted) {
    console.log(`Skipping clip mask application for unmounted component: ${drawingId}`);
    return false;
  }
  
  // Global rate limiting to prevent too many clip mask applications at once
  const now = Date.now();
  if (now - lastGlobalApplyTime < GLOBAL_RATE_LIMIT) {
    console.log(`Rate limited clip mask application for ${drawingId}`);
    return false;
  }
  
  // Rate limit per drawing
  const lastApplyTime = lastApplicationTime.get(drawingId) || 0;
  if (now - lastApplyTime < 3000) { // 3 seconds between apply attempts per drawing
    console.log(`Rate limited clip mask application for specific drawing ${drawingId}`);
    return false;
  }
  
  // Check if we've already successfully applied this mask
  if (successfulApplications.get(drawingId)) {
    console.log(`Clip mask already successfully applied to ${drawingId}`);
    return true;
  }
  
  try {
    // Update tracking
    lastGlobalApplyTime = now;
    lastApplicationTime.set(drawingId, now);
    
    // Track attempts for this drawing
    const attempts = applicationAttempts.get(drawingId) || 0;
    applicationAttempts.set(drawingId, attempts + 1);
    
    if (attempts > maxRetries) {
      console.warn(`Exceeded max retries (${maxRetries}) for drawing ${drawingId}`);
      return false;
    }
    
    // First find the path element
    let pathElement = findPathElement(drawingId, layer);
    
    // If not found through layer, try direct DOM query
    if (!pathElement) {
      pathElement = findSvgPathByDrawingId(drawingId);
    }
    
    if (!pathElement) {
      console.error(`Could not find path element for drawing ${drawingId}`);
      
      if (retryOnFailure) {
        // Schedule a retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, attempts), 10000);
        console.log(`Scheduling retry in ${retryDelay}ms for drawing ${drawingId}`);
        
        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await applyClipMaskToDrawing({
              drawingId,
              layer,
              imageUrl,
              retryOnFailure,
              isMounted,
              stabilityWaitTime,
              maxRetries
            });
            resolve(result);
          }, retryDelay);
        });
      }
      
      return false;
    }
    
    // Generate an identifier for this element to track if it changes
    const elementId = generateElementIdentifier(pathElement);
    const cachedId = elementIdentifiers.get(drawingId);
    
    // If we already have a cached result for this exact element, use it
    if (cachedId === elementId && clipMaskCache.get(drawingId)) {
      console.log(`Using cached clip mask result for ${drawingId}`);
      return true;
    }
    
    // If no explicit imageUrl is provided, try to get one from the floor plan data
    if (!imageUrl) {
      console.log(`No imageUrl provided, checking if ${drawingId} has a floor plan`);
      
      try {
        // Check if we have a floor plan for this drawing
        const hasExistingFloorPlan = await hasFloorPlan(drawingId);
        
        if (hasExistingFloorPlan) {
          // If we have a floor plan, proceed with application using client-side image application
          console.log(`Floor plan exists for ${drawingId}, retrieving image URL from storage`);
          // Note: The actual image URL will be handled by the applyImageClipMask function via localStorage
        } else {
          console.log(`No floor plan found for ${drawingId}`);
          return false;
        }
      } catch (err) {
        console.error(`Error checking floor plan for ${drawingId}:`, err);
        return false;
      }
    }
    
    // Now apply the clip mask with the image
    const result = applyImageClipMask(pathElement, imageUrl || drawingId, drawingId);
    
    if (result) {
      console.log(`Applied clip mask to drawing ${drawingId} with image ${imageUrl || 'from stored floor plan'}`);
      
      // Mark as successful
      successfulApplications.set(drawingId, true);
      elementIdentifiers.set(drawingId, elementId);
      clipMaskCache.set(drawingId, true);
      
      // Trigger events to notify the system that a floor plan was applied
      window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
        detail: { drawingId: drawingId }
      }));
      
      return true;
    } else {
      console.error(`Failed to apply clip mask to drawing ${drawingId}`);
      
      if (retryOnFailure) {
        // Schedule a retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, attempts), 10000);
        console.log(`Scheduling retry in ${retryDelay}ms for drawing ${drawingId}`);
        
        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await applyClipMaskToDrawing({
              drawingId,
              layer,
              imageUrl,
              retryOnFailure,
              isMounted,
              stabilityWaitTime,
              maxRetries
            });
            resolve(result);
          }, retryDelay);
        });
      }
      
      return false;
    }
  } catch (error) {
    console.error(`Error applying clip mask to drawing ${drawingId}:`, error);
    
    if (retryOnFailure) {
      // Schedule a retry with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, applicationAttempts.get(drawingId) || 0), 10000);
      console.log(`Scheduling retry in ${retryDelay}ms for drawing ${drawingId}`);
      
      return new Promise(resolve => {
        setTimeout(async () => {
          const result = await applyClipMaskToDrawing({
            drawingId,
            layer,
            imageUrl,
            retryOnFailure,
            isMounted,
            stabilityWaitTime,
            maxRetries
          });
          resolve(result);
        }, retryDelay);
      });
    }
    
    return false;
  }
};
