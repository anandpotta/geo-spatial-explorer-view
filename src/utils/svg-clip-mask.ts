
/**
 * Utilities for working with SVG clip masks in Leaflet
 */
import { findSvgPathByDrawingId, debugSvgElement } from './svg-path-finder';
import { toast } from 'sonner';
import { applyImageClipMask as coreApplyImageClipMask } from './clip-mask/clip-mask-apply';
import { hasClipMaskApplied } from './clip-mask/clip-mask-checker';

/**
 * Exports for other modules
 */
export { findSvgPathByDrawingId, debugSvgElement, hasClipMaskApplied };

/**
 * Apply an image clip mask to an SVG path element
 */
export const applyImageClipMask = (
  pathElement: SVGPathElement | null,
  imageUrl: string | object | null | undefined,
  drawingId: string
): boolean => {
  console.log(`Applying clip mask for drawing ${drawingId} with element:`, pathElement);
  
  if (!pathElement) {
    console.error(`Failed to apply clip mask: No path element provided for drawing ${drawingId}`);
    return false;
  }
  
  if (!document.contains(pathElement)) {
    console.error(`Failed to apply clip mask: Path element is not in DOM for drawing ${drawingId}`);
    return false;
  }
  
  // Add debugging information
  debugSvgElement(pathElement, `Before applying clip mask to ${drawingId}`);
  
  try {
    // Make sure the drawing ID is set on the path element
    pathElement.setAttribute('data-drawing-id', drawingId);
    
    // Apply the clip mask using our core function
    const result = coreApplyImageClipMask(pathElement, imageUrl, drawingId);
    
    // Add more debugging
    setTimeout(() => {
      debugSvgElement(pathElement, `After applying clip mask to ${drawingId}`);
      
      // Check if fill was properly applied
      const fill = pathElement.getAttribute('fill') || pathElement.style.fill;
      if (!fill || !fill.includes(`pattern-${drawingId}`)) {
        console.warn(`Fill pattern not properly applied to ${drawingId}, attempting to fix`);
        pathElement.style.fill = `url(#pattern-${drawingId})`;
        pathElement.setAttribute('fill', `url(#pattern-${drawingId})`);
      }
      
      // Force a repaint to ensure the change takes effect
      window.dispatchEvent(new Event('resize'));
    }, 200);
    
    return result;
  } catch (err) {
    console.error(`Error in applyImageClipMask for ${drawingId}:`, err);
    return false;
  }
};

/**
 * Apply a clip mask when a floor plan is updated
 */
export const applyClipMaskOnFloorPlanUpdate = async (drawingId: string): Promise<boolean> => {
  console.log(`Attempting to apply clip mask on floor plan update for ${drawingId}`);
  
  try {
    // Find the path element
    const pathElement = findSvgPathByDrawingId(drawingId);
    
    if (!pathElement) {
      console.error(`Could not find path element for drawing ${drawingId}`);
      return false;
    }
    
    // Trigger a floor plan updated event that will apply the clip mask through listeners
    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
      detail: { drawingId, forceRefresh: true } 
    }));
    
    return true;
  } catch (err) {
    console.error(`Error in applyClipMaskOnFloorPlanUpdate for ${drawingId}:`, err);
    return false;
  }
};

/**
 * Check if a path has a clip mask applied
 */
export const hasClipMask = (pathElement: SVGPathElement | null): boolean => {
  if (!pathElement) return false;
  
  const fill = pathElement.getAttribute('fill') || pathElement.style.fill;
  return !!fill && fill.includes('url(#pattern-');
};
