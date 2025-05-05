
import L from 'leaflet';
import { validateFeatureGroupMap } from './utils/MapValidator';
import { calculateButtonPositions } from './utils/ButtonPositionUtils';
import { createRemoveButtonControl } from './controls/RemoveButtonControl';
import { createUploadButtonControl } from './controls/UploadButtonControl';
import { createImageControlsLayer } from './controls/ImageControlsLayer';
import { hasFloorPlan } from './utils/FloorPlanHelpers';

interface LayerControlsProps {
  layer: L.Layer;
  drawingId: string;
  activeTool: string | null;
  featureGroup: L.FeatureGroup;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
  imageControlRoots: Map<string, any>;
  isMounted: boolean;
  onRemoveShape: (drawingId: string) => void;
  onUploadRequest: (drawingId: string) => void;
}

export const createLayerControls = ({
  layer,
  drawingId,
  activeTool,
  featureGroup,
  removeButtonRoots,
  uploadButtonRoots,
  imageControlRoots,
  isMounted,
  onRemoveShape,
  onUploadRequest
}: LayerControlsProps) => {
  if (activeTool !== 'edit' || !isMounted) return;

  // Check if the map is valid
  if (!validateFeatureGroupMap(featureGroup)) {
    console.warn("Map container is not valid, skipping layer controls");
    return;
  }

  // Calculate button positions based on layer geometry
  const { buttonPosition, uploadButtonPosition, imageControlsPosition } = 
    calculateButtonPositions(layer);
  
  if (!buttonPosition) return;
  
  // Create remove button control
  createRemoveButtonControl({
    layer,
    drawingId,
    buttonPosition,
    featureGroup,
    removeButtonRoots,
    isMounted,
    onRemoveShape
  });
  
  // Create upload button control
  if (uploadButtonPosition) {
    createUploadButtonControl({
      drawingId,
      uploadButtonPosition,
      featureGroup,
      uploadButtonRoots, 
      isMounted,
      onUploadRequest
    });
  }
  
  // Check if this drawing has a floor plan
  const hasExistingFloorPlan = hasFloorPlan(drawingId);
  
  // Create image controls if there's a floor plan
  if (hasExistingFloorPlan && imageControlsPosition) {
    createImageControlsLayer({
      drawingId,
      imageControlsPosition,
      featureGroup,
      imageControlRoots,
      isMounted,
      onRemoveShape
    });
  }
};
