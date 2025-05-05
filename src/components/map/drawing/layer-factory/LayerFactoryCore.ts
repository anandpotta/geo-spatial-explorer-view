
import L from 'leaflet';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';
import { setupDrawingOptions } from './DrawingOptionsSetup';
import { createDrawingLayer } from '@/utils/leaflet-drawing-config';
import { attachLayerHandlers } from './LayerHandlerAttachment';
import { LayerFactoryOptions } from './LayerCreator';

/**
 * Core implementation of layer factory
 */
export const layerFactoryCore = ({
  drawing,
  featureGroup,
  activeTool,
  isMounted,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  imageControlsRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onImageTransform
}: LayerFactoryOptions) => {
  try {
    // Check if the feature group is attached to a valid map
    const map = getMapFromLayer(featureGroup);
    if (!isMapValid(map)) {
      console.warn("No valid map attached to feature group, skipping layer creation");
      return;
    }

    // Set up drawing options based on properties
    const options = setupDrawingOptions(drawing);
    
    // Create the layer using the options
    const layer = createDrawingLayer(drawing, options);
    
    if (layer) {
      // Log layer creation to help with debugging
      console.log(`Created layer for drawing: ${drawing.id}, type: ${drawing.geoJSON.type}`);
      
      attachLayerHandlers({
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
      });
    }
  } catch (err) {
    console.error('Error in layer factory core:', err);
    throw err;
  }
};
