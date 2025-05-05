
import L from 'leaflet';
import { toast } from 'sonner';
import { findSvgPathByDrawingId } from '@/utils/svg-path-finder';
import { applyImageClipMask } from '@/utils/clip-mask';
import { getFloorPlan } from '@/utils/floor-plan-utils';

interface ApplyClipMaskProps {
  drawingId: string;
  isMounted: boolean;
  layer?: L.Layer;
}

export const applyClipMaskToDrawing = ({ 
  drawingId, 
  isMounted, 
  layer 
}: ApplyClipMaskProps): void => {
  if (!drawingId || !isMounted) return;
  
  try {
    // Get floor plan data for this drawing
    const floorPlanData = getFloorPlan(drawingId);
    
    if (!floorPlanData) {
      console.log(`No floor plan found for drawing ${drawingId}`);
      return;
    }
    
    // Find the SVG path element for this drawing
    const pathElement = findSvgPathByDrawingId(drawingId);
    if (!pathElement) {
      console.warn(`Could not find SVG path element for drawing ${drawingId}`);
      return;
    }
    
    // Apply the clip mask
    console.log(`Applying clip mask for drawing ${drawingId}`);
    const imageData = floorPlanData.imageData;
    
    // Make multiple attempts to apply the clip mask with increasing delays
    let attempts = 0;
    const maxAttempts = 10; // Increased from 5 to 10
    
    const tryApply = () => {
      if (attempts >= maxAttempts) return;
      
      attempts++;
      console.log(`Attempt ${attempts} to apply clip mask for drawing ${drawingId}`);
      const applied = applyImageClipMask(pathElement, imageData, drawingId);
      
      if (!applied && attempts < maxAttempts) {
        // Use exponential backoff for retries (300ms, 600ms, 1200ms, etc.)
        const delay = Math.min(300 * Math.pow(1.5, attempts - 1), 3000);
        console.log(`Attempt ${attempts} failed, trying again in ${delay}ms`);
        setTimeout(tryApply, delay);
      } else if (!applied) {
        console.warn(`Failed to apply clip mask for drawing ${drawingId} after ${maxAttempts} attempts`);
      } else {
        console.log(`Successfully applied clip mask on attempt ${attempts}`);
        
        // Force a redraw after successful application
        setTimeout(() => {
          if (pathElement && document.contains(pathElement)) {
            const svg = pathElement.closest('svg');
            if (svg) {
              console.log('Forcing SVG redraw after successful clip mask application');
              svg.style.display = 'none';
              svg.getBoundingClientRect(); // Force reflow
              svg.style.display = '';
            }
          }
        }, 100);
      }
    };
    
    tryApply();
  } catch (err) {
    console.error('Error applying clip mask to drawing:', err);
    toast.error('Could not apply floor plan to drawing');
  }
};
