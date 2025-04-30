
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
    layer.eachLayer((l: L.Layer) => {
      if (l && isMounted) {
        // Prepare the layer with basic properties
        prepareLayerForDrawing(l, drawing.id);
        
        // Setup SVG path attributes if available
        setupSvgPathAttributes(l, drawing);
        
        // Store the layer reference
        layersRef.set(drawing.id, l);
        
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
        
        // Add rotation controls if there's a masked image
        if (drawing.maskedImage && onRotateImage) {
          addRotationControls({
            layer: l,
            drawingId: drawing.id,
            featureGroup,
            rotationControlRoots,
            isMounted,
            onRotateImage
          });
        }
        
        // Setup click handler for region interaction
        setupLayerClickHandler({
          layer: l,
          drawing,
          isMounted,
          onRegionClick
        });
      }
    });
    
    if (isMounted) {
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
