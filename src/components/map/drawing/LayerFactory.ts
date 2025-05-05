
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getDefaultDrawingOptions, createDrawingLayer } from '@/utils/leaflet-drawing-config';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';
import { getDefaultTransformOptions, ImageTransformOptions } from '@/utils/image-transform-utils';
import { addImageToLayer } from '@/utils/layer-image-utils';
import { createLayerControls } from './LayerControls';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { getSavedMarkers } from '@/utils/marker-utils';

export interface LayerFactoryOptions {
  drawing: DrawingData;
  featureGroup: L.FeatureGroup;
  activeTool: string | null;
  isMounted: boolean;
  layersRef: Map<string, L.Layer>;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
  imageControlsRoots: Map<string, any>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onImageTransform?: (drawingId: string, options: Partial<ImageTransformOptions>) => void;
}

export const createLayerFromDrawing = ({
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
  if (!drawing.geoJSON || !isMounted) return;

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
    console.error('Error adding drawing layer:', err);
  }
};

function setupDrawingOptions(drawing: DrawingData): L.PathOptions {
  // Use imported functions instead of requiring them
  const drawingsWithFloorPlans = getDrawingIdsWithFloorPlans();
  const markers = getSavedMarkers();
  
  const associatedMarker = markers.find((m: any) => m.associatedDrawing === drawing.id);
  const hasFloorPlan = drawingsWithFloorPlans.includes(drawing.id);
  
  const options = getDefaultDrawingOptions(drawing.properties.color);
  if (hasFloorPlan) {
    options.fillColor = '#3b82f6';
    options.fillOpacity = 0.4;
    options.color = '#1d4ed8';
  }
  
  // Always ensure opacity is set to visible values
  options.opacity = 1;
  options.fillOpacity = options.fillOpacity || 0.2;
  
  return options;
}

function attachLayerHandlers({
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
}: LayerFactoryOptions & { layer: L.GeoJSON }) {
  layer.eachLayer((l: L.Layer) => {
    if (l && isMounted) {
      (l as any).drawingId = drawing.id;
      
      // Store the layer reference
      layersRef.set(drawing.id, l);
      
      // Add the image if available
      if (drawing.imageData) {
        console.log('Adding image to layer for drawing:', drawing.id);
        addImageToLayer(
          l, 
          drawing.id, 
          drawing.imageData, 
          drawing.imageTransform || getDefaultTransformOptions(),
          imageControlsRoots,
          onImageTransform
        );
      }
      
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
  
  if (isMounted) {
    try {
      layer.addTo(featureGroup);
    } catch (err) {
      console.error('Error adding layer to featureGroup:', err);
    }
  }
}
