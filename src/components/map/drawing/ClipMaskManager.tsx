
import { toast } from 'sonner';
import { applyImageClipMask, findSvgPathByDrawingId } from '@/utils/svg-clip-mask';

interface ClipMaskOptions {
  drawingId: string;
  isMounted: boolean;
  layer: any;
}

/**
 * Applies a clip mask to an SVG path for a drawing with a floor plan
 */
export const applyClipMaskToDrawing = ({ 
  drawingId, 
  isMounted,
  layer
}: ClipMaskOptions) => {
  if (!isMounted) return;
  
  console.log(`Drawing ${drawingId} has a floor plan, will try to apply clip mask`);
  
  // Use a retry mechanism with exponential backoff
  const maxRetries = 15;
  let currentRetry = 0;
  
  const attemptApplyClipMask = () => {
    if (!isMounted) return;
    
    try {
      // Try to find the path element using enhanced finder
      const pathElement = findSvgPathByDrawingId(drawingId);
      
      // Check for the layer's direct path element if no path found yet
      if (!pathElement && layer && layer._path) {
        // If layer has a direct path element, use that and make sure it has the ID
        layer._path.setAttribute('data-drawing-id', drawingId);
        console.log(`Found path directly from layer for drawing ${drawingId}`);
        attemptApplyClipMaskWithPath(layer._path);
        return;
      }
      
      // Check each layer if it's a feature group
      if (!pathElement && layer && typeof layer.eachLayer === 'function') {
        layer.eachLayer((subLayer: any) => {
          if (subLayer && subLayer._path) {
            subLayer._path.setAttribute('data-drawing-id', drawingId);
            console.log(`Found path from sublayer for drawing ${drawingId}`);
            attemptApplyClipMaskWithPath(subLayer._path);
            return;
          }
        });
      }
      
      if (pathElement) {
        console.log(`Found path element for drawing ${drawingId}`);
        attemptApplyClipMaskWithPath(pathElement);
      } else {
        console.error(`Path element not found for drawing ${drawingId}`);
        
        // Try again with exponential backoff
        if (currentRetry < maxRetries) {
          currentRetry++;
          const delay = Math.min(300 * Math.pow(1.5, currentRetry), 3000);
          console.log(`Retrying to find path element for drawing ${drawingId} (Attempt ${currentRetry} of ${maxRetries}) in ${delay}ms`);
          setTimeout(attemptApplyClipMask, delay);
        } else {
          console.error(`Failed to find path element for drawing ${drawingId} after ${maxRetries} attempts`);
          toast.error(`Could not apply floor plan to drawing. Please try refreshing the page.`);
        }
      }
    } catch (err) {
      console.error('Error restoring clip mask:', err);
      
      // Try again on error with exponential backoff
      if (currentRetry < maxRetries) {
        currentRetry++;
        const delay = Math.min(300 * Math.pow(1.5, currentRetry), 3000);
        setTimeout(attemptApplyClipMask, delay);
      }
    }
  };
  
  const attemptApplyClipMaskWithPath = (pathElement: SVGPathElement) => {
    // Get floor plan data from localStorage
    const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    const floorPlan = floorPlans[drawingId];
    
    if (floorPlan && floorPlan.data) {
      console.log(`Found floor plan data for drawing ${drawingId}`);
      
      // Apply image as clip mask
      const result = applyImageClipMask(
        pathElement,
        floorPlan.data,
        drawingId
      );
      
      if (result) {
        console.log(`Successfully applied clip mask for drawing ${drawingId}`);
        
        // Force redraw after mask applied
        setTimeout(() => {
          try {
            // Force update of the layer's visual appearance
            if (layer && typeof layer.redraw === 'function') {
              layer.redraw();
            }
            
            // For GeoJSON layers which may not have a direct redraw method
            if (layer && layer.eachLayer) {
              layer.eachLayer((subLayer: any) => {
                if (subLayer && typeof subLayer.redraw === 'function') {
                  subLayer.redraw();
                }
              });
            }
            
            // Trigger window resize as a fallback
            window.dispatchEvent(new Event('resize'));
          } catch (e) {
            console.error("Error redrawing after applying clip mask:", e);
          }
        }, 50);
      } else {
        console.error(`Failed to apply clip mask for drawing ${drawingId}`);
        
        // Try again with exponential backoff
        if (currentRetry < maxRetries) {
          currentRetry++;
          const delay = Math.min(300 * Math.pow(1.5, currentRetry), 3000);
          setTimeout(attemptApplyClipMask, delay);
        }
      }
    } else {
      console.log(`No floor plan data found for drawing ${drawingId}`);
    }
  };
  
  // Start the retry process with an initial delay
  setTimeout(attemptApplyClipMask, 100);
};
