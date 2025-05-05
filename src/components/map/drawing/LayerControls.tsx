
import L from 'leaflet';
import { validateFeatureGroupMap } from './utils/MapValidator';
import { createUploadButtonControl } from './controls/UploadButtonControl';

interface LayerControlsProps {
  layer: L.Layer;
  drawingId: string;
  activeTool: string | null;
  featureGroup: L.FeatureGroup;
  uploadButtonRoots: Map<string, any>;
  isMounted: boolean;
  onUploadRequest: (drawingId: string) => void;
}

export const createLayerControls = ({
  layer,
  drawingId,
  activeTool,
  featureGroup,
  uploadButtonRoots,
  isMounted,
  onUploadRequest
}: LayerControlsProps) => {
  // Check if the map is valid
  if (!validateFeatureGroupMap(featureGroup)) {
    console.warn("Map container is not valid, skipping layer controls");
    return;
  }
};
