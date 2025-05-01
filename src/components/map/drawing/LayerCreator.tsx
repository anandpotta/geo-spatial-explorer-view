import L from 'leaflet';
import { DrawingData } from '@/utils/drawing/types';
import { createLayerFromDrawingData, prepareLayerForDrawing, setupSvgPathAttributes } from '@/utils/layer-creator-utils';
import { createLayerControls } from './LayerControls';
import { setupLayerClickHandler } from './LayerInteractionHandler';
import { addRotationControls } from './RotationControlsCreator';
import { ensureLayerVisibility, forceSvgPathCreation } from './svg';

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
        // Set default style options for visibility
        if ((layer as any).options) {
          (layer as any).options.fillOpacity = (layer as any).options.fillOpacity || 0.5;
          (layer as any).options.opacity = (layer as any).options.opacity || 1;
          (layer as any).options.weight = (layer as any).options.weight || 3;
          (layer as any).options.color = (layer as any).options.color || '#3388ff';
        }
        
        layer.addTo(featureGroup);
        
        // Force SVG path creation and ensure visibility after adding to the feature group
        forceSvgPathCreation(layer);
        ensureLayerVisibility(layer);
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
  
  // Ensure the layer has proper styling for visibility
  if ((layer as any).options) {
    (layer as any).options.fillOpacity = (layer as any).options.fillOpacity || 0.5;
    (layer as any).options.opacity = (layer as any).options.opacity || 1;
    (layer as any).options.weight = (layer as any).options.weight || 3;
    (layer as any).options.color = (layer as any).options.color || '#3388ff';
  }
  
  // Force SVG path creation and ensure visibility
  forceSvgPathCreation(layer);
  ensureLayerVisibility(layer);
  
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
