import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { ImageTransformOptions, getDefaultTransformOptions } from '@/utils/image-transform-utils';
import { addImageToLayer } from '@/utils/layer-image-utils';
import { createLayerControls } from '../LayerControls';
import { getFloorPlanById } from '@/utils/floor-plan-utils';
import { LayerFactoryOptions } from './LayerCreator';

/**
 * Attaches all necessary handlers and event listeners to a layer
 */
export const attachLayerHandlers = ({
  layer,
  drawing,
  featureGroup,
  isMounted,
  layersRef,
  imageControlsRoots,
  removeButtonRoots,
  uploadButtonRoots,
  activeTool,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onImageTransform
}: LayerFactoryOptions & { layer: L.GeoJSON }) => {
  try {
    // Add the layer to the feature group first to ensure it's properly initialized
    layer.addTo(featureGroup);
    
    // Store the layer reference
    layersRef.set(drawing.id, layer);
    
    layer.eachLayer((l: L.Layer) => {
      if (l && isMounted) {
        (l as any).drawingId = drawing.id;
        
        handleLayerImages(l, drawing, imageControlsRoots, onImageTransform);
        
        // Add the remove and upload buttons when in edit mode
        if (onRemoveShape && onUploadRequest) {
          createLayerControls({
            layer: l,
            drawingId: drawing.id,
            activeTool,
            featureGroup,
            removeButtonRoots,
            uploadButtonRoots,
            isMounted,
            onRemoveShape,
            onUploadRequest
          });
        }
        
        // Make clicking on any shape trigger the click handler
        if (onRegionClick && isMounted) {
          l.on('click', (e) => {
            // Stop event propagation to prevent map click
            if (e.originalEvent) {
              L.DomEvent.stopPropagation(e.originalEvent);
            }
            
            if (isMounted) {
              onRegionClick(drawing);
            }
          });
        }
      }
    });
  } catch (err) {
    console.error('Error attaching layer handlers:', err);
  }
};

/**
 * Handles adding images to the layer (floor plans or custom images)
 */
const handleLayerImages = (
  l: L.Layer, 
  drawing: DrawingData, 
  imageControlsRoots: Map<string, any>,
  onImageTransform?: (drawingId: string, options: Partial<ImageTransformOptions>) => void
) => {
  // Check for floor plan first
  const floorPlan = getFloorPlanById(drawing.id);
  
  // If we have a floor plan, add it as the primary image
  if (floorPlan && floorPlan.data) {
    console.log('Adding floor plan to layer for drawing:', drawing.id);
    
    // Add a small delay to ensure the layer is fully rendered
    setTimeout(() => {
      addImageToLayer(
        l, 
        drawing.id, 
        floorPlan.data,
        drawing.imageTransform || getDefaultTransformOptions(),
        imageControlsRoots,
        onImageTransform
      );
    }, 100);
  }
  // Otherwise fall back to any image data on the drawing itself
  else if (drawing.imageData) {
    console.log('Adding image to layer for drawing:', drawing.id);
    
    // Add a small delay to ensure the layer is fully rendered
    setTimeout(() => {
      addImageToLayer(
        l, 
        drawing.id, 
        drawing.imageData, 
        drawing.imageTransform || getDefaultTransformOptions(),
        imageControlsRoots,
        onImageTransform
      );
    }, 100);
  }
};
