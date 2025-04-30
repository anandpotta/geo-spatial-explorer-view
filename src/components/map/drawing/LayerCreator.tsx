
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing/types';
import { createLayerFromDrawingData, prepareLayerForDrawing, setupSvgPathAttributes } from '@/utils/layer-creator-utils';
import { createLayerControls } from './LayerControls';
import { setupLayerClickHandler } from './LayerInteractionHandler';
import { addRotationControls } from './RotationControlsCreator';

interface CreateLayerOptions {
  drawing: DrawingData;
  featureGroup: L.FeatureGroup;
  activeTool: string | null;
  isMounted: boolean;
  layersRef: Map<string, L.Layer>;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
  rotationControlRoots: Map<string, any>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onRotateImage?: (drawingId: string, degrees: number) => void;
}

export const createLayerFromDrawing = ({
  drawing,
  featureGroup,
  activeTool,
  isMounted,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  rotationControlRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onRotateImage
}: CreateLayerOptions) => {
  const layer = createLayerFromDrawingData({
    drawing,
    featureGroup,
    isMounted
  });
  
  if (!layer) return;

  try {
    // Check if layer is a feature group or collection
    if ('eachLayer' in layer) {
      // Process each layer in the collection
      (layer as L.FeatureGroup).eachLayer((l: L.Layer) => {
        processIndividualLayer({
          layer: l,
          drawing,
          featureGroup,
          activeTool,
          isMounted,
          layersRef,
          removeButtonRoots,
          uploadButtonRoots,
          rotationControlRoots,
          onRegionClick,
          onRemoveShape,
          onUploadRequest,
          onRotateImage
        });
      });
    } else {
      // Process single layer
      processIndividualLayer({
        layer,
        drawing,
        featureGroup,
        activeTool,
        isMounted,
        layersRef,
        removeButtonRoots,
        uploadButtonRoots,
        rotationControlRoots,
        onRegionClick,
        onRemoveShape,
        onUploadRequest,
        onRotateImage
      });
    }
    
    // Add layer to feature group if it hasn't already been added as part of processing
    if (isMounted && !('eachLayer' in layer)) {
      try {
        layer.addTo(featureGroup);
      } catch (err) {
        console.error('Error adding layer to featureGroup:', err);
      }
    }
  } catch (err) {
    console.error('Error adding drawing layer:', err);
  }
};

// Helper function to process each individual layer
const processIndividualLayer = ({
  layer,
  drawing,
  featureGroup,
  activeTool,
  isMounted,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  rotationControlRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onRotateImage
}: CreateLayerOptions & { layer: L.Layer }) => {
  if (!layer || !isMounted) return;
  
  // Prepare the layer with basic properties
  prepareLayerForDrawing(layer, drawing.id);
  
  // Setup SVG path attributes if available
  setupSvgPathAttributes(layer, drawing);
  
  // Store the layer reference
  layersRef.set(drawing.id, layer);
  
  // Add the remove and upload buttons when in edit mode
  if (onRemoveShape && onUploadRequest) {
    createLayerControls({
      layer,
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
  
  // Add rotation controls if there's a masked image
  if (drawing.maskedImage && onRotateImage) {
    addRotationControls({
      layer,
      drawingId: drawing.id,
      featureGroup,
      rotationControlRoots,
      isMounted,
      onRotateImage
    });
  }
  
  // Setup click handler for region interaction
  setupLayerClickHandler({
    layer,
    drawing,
    isMounted,
    onRegionClick
  });
};
