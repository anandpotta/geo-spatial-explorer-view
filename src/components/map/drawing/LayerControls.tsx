
import L from 'leaflet';
import { validateLayerMap } from './utils/MapValidationUtils';
import { calculateButtonPositions } from './utils/ButtonPositionUtils';
import { createRemoveButtonControl } from './controls/RemoveButtonControl';
import { createUploadButtonControl } from './controls/UploadButtonControl';

interface LayerControlsProps {
  layer: L.Layer;
  drawingId: string;
  activeTool: string | null;
  featureGroup: L.FeatureGroup;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
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
  isMounted,
  onRemoveShape,
  onUploadRequest
}: LayerControlsProps) => {
  if (activeTool !== 'edit' || !isMounted) return;

  // Check if the map is valid
  if (!validateLayerMap(featureGroup)) return;

  // Calculate button positions
  const { buttonPosition, uploadButtonPosition } = calculateButtonPositions(layer);
  
  if (!buttonPosition) return;
  
  // Create the remove button control
  createRemoveButtonControl({
    layer,
    drawingId,
    buttonPosition,
    featureGroup,
    removeButtonRoots,
    isMounted,
    onRemoveShape
  });
  
  // Create the upload button control if we have a position for it
  if (uploadButtonPosition) {
    createUploadButtonControl({
      layer,
      drawingId,
      uploadButtonPosition,
      featureGroup,
      uploadButtonRoots,
      isMounted,
      onUploadRequest
    });
  }
};
