
import { CreateLayerFromDrawingProps } from './layer-creator/types';
import { createLayerFromDrawingData } from './layer-creator/LayerFactory';
import { setupLayerClickHandler } from './layer-creator/LayerClickHandlers';
import { setupSvgPath } from './layer-creator/SvgPathSetup';
import { addEditModeButtons } from './layer-creator/EditModeButtons';

export function createLayerFromDrawing({
  drawing,
  featureGroup,
  activeTool,
  isMounted,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  imageControlRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest
}: CreateLayerFromDrawingProps) {
  if (!isMounted) return;

  try {
    // Create the layer based on drawing type
    const layer = createLayerFromDrawingData(drawing);
    if (!layer) return;

    // Set up click handling for the layer
    setupLayerClickHandler(layer, drawing, onUploadRequest, onRegionClick);

    // Add the layer to the feature group
    featureGroup.addLayer(layer);
    layersRef.set(drawing.id, layer);

    // Set up the SVG path attributes and handlers
    setupSvgPath(drawing, isMounted, onUploadRequest, onRegionClick);

    // Add buttons for edit mode
    if (activeTool === 'edit') {
      setTimeout(() => {
        if (!isMounted) return;
        addEditModeButtons(
          layer,
          drawing,
          featureGroup,
          isMounted,
          removeButtonRoots,
          uploadButtonRoots,
          imageControlRoots,
          onRemoveShape,
          onUploadRequest
        );
      }, 300);
    }

    console.log(`Successfully created layer for drawing: ${drawing.id}`);
  } catch (error) {
    console.error(`Error creating layer for drawing ${drawing.id}:`, error);
  }
}
