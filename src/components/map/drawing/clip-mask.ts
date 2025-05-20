
import L from 'leaflet';
import { applyImageClipMask, findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
import { getFloorPlanById } from '@/utils/floor-plan-utils';

interface ClipMaskOptions {
  drawingId: string;
  isMounted: boolean;
  layer: L.Layer;
}

/**
 * Apply a clip mask to a drawing layer
 */
export const applyClipMaskToDrawing = async ({ 
  drawingId, 
  isMounted, 
  layer 
}: ClipMaskOptions): Promise<boolean> => {
  if (!isMounted || !drawingId) {
    return false;
  }
  
  console.log(`Attempting to apply clip mask to drawing ${drawingId}`);
  
  try {
    // Try multiple approaches to find the path element
    const findPathWithFallbacks = async () => {
      // First try the fastest method - direct element find
      let pathElement = findSvgPathByDrawingId(drawingId);
      
      if (!pathElement && layer) {
        // If no path found and we have the layer, try to get it from the layer
        if (layer instanceof L.Path) {
          pathElement = layer.getElement() as SVGPathElement;
          if (pathElement) {
            // Make sure it has the drawing ID attribute
            pathElement.setAttribute('data-drawing-id', drawingId);
            console.log(`Found path from layer element for ${drawingId}`);
          }
        } else if ('eachLayer' in layer) {
          // For GeometryCollection or FeatureGroup layers, check each sublayer
          (layer as L.LayerGroup).eachLayer((sublayer) => {
            if (!pathElement && sublayer instanceof L.Path) {
              pathElement = sublayer.getElement() as SVGPathElement;
              if (pathElement) {
                pathElement.setAttribute('data-drawing-id', drawingId);
                console.log(`Found path from sublayer element for ${drawingId}`);
              }
            }
          });
        }
      }
      
      return pathElement;
    };
    
    // Get the path element
    const pathElement = await findPathWithFallbacks();
    
    if (!pathElement) {
      console.error(`Could not find path element for drawing ${drawingId}`);
      return false;
    }
    
    // Get the floor plan data
    const floorPlan = await getFloorPlanById(drawingId);
    
    if (floorPlan && floorPlan.data) {
      // Apply the clip mask with the floor plan image
      console.log(`Applying clip mask with floor plan data for ${drawingId}`);
      return applyImageClipMask(pathElement, floorPlan.data, drawingId);
    } else {
      console.log(`No floor plan found for ${drawingId}, not applying clip mask`);
      return false;
    }
  } catch (err) {
    console.error(`Error applying clip mask to drawing ${drawingId}:`, err);
    return false;
  }
};

/**
 * Refresh clip masks for all drawings
 */
export const refreshAllClipMasks = async (): Promise<void> => {
  const paths = document.querySelectorAll('path[data-drawing-id]');
  console.log(`Found ${paths.length} paths with drawing IDs for refresh`);
  
  for (const path of Array.from(paths)) {
    const drawingId = path.getAttribute('data-drawing-id');
    if (drawingId) {
      try {
        const floorPlan = await getFloorPlanById(drawingId);
        if (floorPlan && floorPlan.data) {
          console.log(`Refreshing clip mask for drawing ${drawingId}`);
          applyImageClipMask(path as SVGPathElement, floorPlan.data, drawingId);
        }
      } catch (err) {
        console.error(`Error refreshing clip mask for ${drawingId}:`, err);
      }
    }
  }
};
