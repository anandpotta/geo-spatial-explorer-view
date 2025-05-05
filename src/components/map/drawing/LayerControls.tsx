
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
  // Only proceed if we're in edit mode and component is mounted
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
  
  // Create image controls for all drawings in edit mode
  // This ensures the controls are always available in edit mode
  if (imageControlsPosition) {
    // Add a small delay to ensure image controls are created after edit mode is activated
    setTimeout(() => {
      if (isMounted && activeTool === 'edit') {
        createImageControlsLayer({
          drawingId,
          imageControlsPosition,
          featureGroup,
          imageControlRoots,
          isMounted,
          onRemoveShape,
          isPersistent: true  // Mark as persistent to prevent removal
        });
      }
    }, 100);
  }
};
