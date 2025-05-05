
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';
import { getSavedMarkers } from '@/utils/marker-utils';
import { createLayerControls } from './LayerControls';
import { toast } from 'sonner';
import { hasFloorPlan, prepareLayerOptions, createGeoJSONLayer, addDrawingAttributesToLayer } from './LayerUtils';
import { setupLayerClickHandlers } from './LayerEventHandlers';
import { applyClipMaskToDrawing } from './ClipMaskManager';

interface CreateLayerOptions {
  drawing: DrawingData;
  featureGroup: L.FeatureGroup;
  activeTool: string | null;
  isMounted: boolean;
  layersRef: Map<string, L.Layer>;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
  imageControlRoots: Map<string, any>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
}

export const createLayerFromDrawing = ({
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
}: CreateLayerOptions) => {
  if (!drawing.geoJSON || !isMounted) return;

  try {
    // Check if the feature group is attached to a valid map
    const map = getMapFromLayer(featureGroup);
    if (!isMapValid(map)) {
      console.warn("No valid map attached to feature group, skipping layer creation");
      return;
    }

    // Prepare layer options
    const options = prepareLayerOptions(drawing);
    
    // We can't directly add drawingId to options as it's not part of the PathOptions type
    // Instead, let's use custom data attributes later
    
    // Create the layer
    const layer = createGeoJSONLayer(drawing, options);
    
    if (layer) {
      // Store the drawing ID at the layer level using a custom property
      (layer as any).drawingId = drawing.id;
      
      // Add feature properties with drawing ID
      // We need to check if feature and feature.properties exist before using them
      if (layer.feature) {
        if (!layer.feature.properties) {
          // Initialize properties safely
          layer.feature.properties = {};
        }
        if (layer.feature.properties) {
          layer.feature.properties.drawingId = drawing.id;
        }
      }
      
      layer.eachLayer((l: L.Layer) => {
        if (l && isMounted) {
          // Store the drawing ID on each sublayer
          (l as any).drawingId = drawing.id;
          
          // Store feature properties with drawing ID - check types first
          if ((l as any).feature) {
            if (!(l as any).feature.properties) {
              (l as any).feature.properties = {};
            }
            if ((l as any).feature.properties) {
              (l as any).feature.properties.drawingId = drawing.id;
            }
          }
          
          // Add drawing ID attribute to the SVG path for identification
          addDrawingAttributesToLayer(l, drawing.id);
          
          // Set the id on the SVG element itself if possible
          if ((l as any)._path) {
            (l as any)._path.setAttribute('data-drawing-id', drawing.id);
          }
          
          // Store the layer reference
          layersRef.set(drawing.id, l);
          
          // Add the remove, upload, and image control buttons when in edit mode
          if (onRemoveShape && onUploadRequest) {
            createLayerControls({
              layer: l,
              drawingId: drawing.id,
              activeTool,
              featureGroup,
              removeButtonRoots,
              uploadButtonRoots,
              imageControlRoots,
              isMounted,
              onRemoveShape,
              onUploadRequest
            });
          }
          
          // Make clicking on any shape trigger the click handler
          setupLayerClickHandlers(l, drawing, isMounted, onRegionClick);
        }
      });
      
      if (isMounted) {
        try {
          // Add to feature group
          layer.addTo(featureGroup);
          
          // Get all the SVG paths after adding to the feature group
          setTimeout(() => {
            const paths = document.querySelectorAll('path.leaflet-interactive');
            console.log(`Found ${paths.length} path elements after adding layer to feature group`);
            
            // Set drawing ID on all paths that might be related to this drawing
            paths.forEach((path) => {
              if (!path.hasAttribute('data-drawing-id')) {
                path.setAttribute('data-drawing-id', drawing.id);
                console.log(`Set data-drawing-id attribute on a path element`);
              }
            });
            
            // Apply clip mask if a floor plan exists
            if (hasFloorPlan(drawing.id)) {
              applyClipMaskToDrawing({
                drawingId: drawing.id,
                isMounted,
                layer
              });
            }
          }, 50);
        } catch (err) {
          console.error('Error adding layer to featureGroup:', err);
        }
      }
    }
  } catch (err) {
    console.error('Error adding drawing layer:', err);
  }
};
