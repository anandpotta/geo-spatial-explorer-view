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

// Keep track of floor plan applications to prevent repeated attempts
const floorPlanApplied = new Map<string, number>();

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
    
    // Create the layer
    const layer = createGeoJSONLayer(drawing, options);
    
    if (layer) {
      // Store the drawing ID at the layer level as well for easier reference
      (layer as any).drawingId = drawing.id;
      
      layer.eachLayer((l: L.Layer) => {
        if (l && isMounted) {
          // Add the ID at the sublayer level too
          (l as any).drawingId = drawing.id;
          
          // Add drawing ID attribute to the SVG path for identification
          addDrawingAttributesToLayer(l, drawing.id);
          
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
          layer.addTo(featureGroup);
          
          // Check if we've recently applied a floor plan to this drawing to avoid repeated attempts
          const lastApplied = floorPlanApplied.get(drawing.id) || 0;
          const now = Date.now();
          const shouldApply = now - lastApplied > 5000; // 5 seconds debounce
          
          // Add a small delay before applying clip mask to ensure the path is rendered
          if (hasFloorPlan(drawing.id) && isMounted && shouldApply) {
            floorPlanApplied.set(drawing.id, now);
            
            setTimeout(() => {
              // Apply clip mask if a floor plan exists
              if (isMounted) {
                applyClipMaskToDrawing({
                  drawingId: drawing.id,
                  isMounted,
                  layer
                });
              }
            }, 250); // Short delay to let the DOM update
          }
        } catch (err) {
          console.error('Error adding layer to featureGroup:', err);
        }
      }
    }
  } catch (err) {
    console.error('Error adding drawing layer:', err);
  }
};
