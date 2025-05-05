
import L from 'leaflet';
import { toast } from 'sonner';
import { findSvgPathByDrawingId } from '@/utils/svg-path-finder';
import { applyImageClipMask } from '@/utils/svg-clip-mask';
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
    const applied = applyImageClipMask(pathElement, imageData, drawingId);
    
    if (!applied) {
      console.warn(`Failed to apply clip mask for drawing ${drawingId}`);
    }
  } catch (err) {
    console.error('Error applying clip mask to drawing:', err);
    toast.error('Could not apply floor plan to drawing');
  }
};
