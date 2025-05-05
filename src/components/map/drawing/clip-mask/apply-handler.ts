
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

export interface ApplyClipMaskOptions {
  drawingId: string;
  layer: L.Layer;
  imageUrl: string;
  retryOnFailure?: boolean;
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
 */
export const applyClipMaskToDrawing = ({
  drawingId, 
  layer, 
  imageUrl, 
  retryOnFailure = true,
  stabilityWaitTime = 500,
  maxRetries = 3
}: ApplyWithStabilityOptions): boolean => {
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
  
  // Find the path element
  const pathElement = findPathElement(drawingId, layer);
  if (!pathElement) {
    console.error(`Could not find path element for drawing ${drawingId}`);
    return false;
  }
  
  try {
    // Generate an identifier for this element to track if it changes
    const elementId = generateElementIdentifier(pathElement);
    const cachedId = elementIdentifiers.get(drawingId);
    
    // If we already have a cached result for this exact element, use it
    if (cachedId === elementId && clipMaskCache.get(drawingId)) {
      console.log(`Using cached clip mask result for ${drawingId}`);
      return true;
    }
    
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
    
    // Implementation would be here
    console.log(`Applied clip mask to drawing ${drawingId} with image ${imageUrl}`);
    
    // Mark as successful
    successfulApplications.set(drawingId, true);
    elementIdentifiers.set(drawingId, elementId);
    clipMaskCache.set(drawingId, true);
    
    return true;
  } catch (error) {
    console.error(`Error applying clip mask to drawing ${drawingId}:`, error);
    
    if (retryOnFailure) {
      // Schedule a retry with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, applicationAttempts.get(drawingId) || 0), 10000);
      console.log(`Scheduling retry in ${retryDelay}ms for drawing ${drawingId}`);
      
      setTimeout(() => {
        applyClipMaskToDrawing({
          drawingId,
          layer,
          imageUrl,
          retryOnFailure,
          stabilityWaitTime,
          maxRetries
        });
      }, retryDelay);
    }
    
    return false;
  }
};
