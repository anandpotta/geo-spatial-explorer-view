
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';
import { getSavedMarkers } from '@/utils/marker-utils';
import { createLayerControls } from './LayerControls';
import { toast } from 'sonner';
import { prepareLayerOptions, createGeoJSONLayer, addDrawingAttributesToLayer } from './LayerUtils';
import { setupLayerClickHandlers } from './LayerEventHandlers';
import { applyClipMaskToDrawing } from './clip-mask';
import { hasFloorPlan } from '@/utils/floor-plan-utils';

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

// Keep track of layer creation to prevent repeated attempts
const layersCreated = new Map<string, number>();
// Track floor plan applications to prevent repeated attempts
const floorPlanApplied = new Map<string, number>();

export const createLayerFromDrawing = async ({
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
  
  // Check if we've already created this layer recently
  const now = Date.now();
  const lastCreated = layersCreated.get(drawing.id) || 0;
  if (now - lastCreated < 1000) { // Debounce layer creation
    return;
  }
  
  // Update the creation timestamp
  layersCreated.set(drawing.id, now);

  try {
    // Check if the feature group is attached to a valid map
    const map = getMapFromLayer(featureGroup);
    if (!isMapValid(map)) {
      return;
    }

    // Check if this layer already exists
    let existingLayer = false;
    featureGroup.eachLayer(layer => {
      if ((layer as any).drawingId === drawing.id) {
        existingLayer = true;
      }
    });
    
    if (existingLayer) {
      console.log(`Layer for drawing ${drawing.id} already exists, skipping creation`);
      return;
    }

    // Prepare layer options - this is now async
    const options = await prepareLayerOptions(drawing);
    
    // Create the layer
    const layer = createGeoJSONLayer(drawing, options);
    
    if (!layer) {
      return;
    }
    
    // Store the drawing ID at the layer level as well for easier reference
    (layer as any).drawingId = drawing.id;
    
    // Process the layer and add it to the feature group
    layer.eachLayer((l: L.Layer) => {
      if (l && isMounted) {
        // Add the ID at the sublayer level too
        (l as any).drawingId = drawing.id;
        
        // Store the layer reference FIRST
        layersRef.set(drawing.id, l);
      }
    });
    
    // Add the layer to the feature group FIRST
    if (isMounted && layer) {
      featureGroup.addLayer(layer);
      
      // THEN add drawing ID attributes after the layer is added to the map
      // This ensures the DOM elements exist
      setTimeout(() => {
        layer.eachLayer((l: L.Layer) => {
          if (l && isMounted) {
            // Add drawing ID attribute to the SVG path for identification
            addDrawingAttributesToLayer(l, drawing.id);
            
            // Add controls when in edit mode
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
            
            // Setup click handlers
            setupLayerClickHandlers(l, drawing, isMounted, onRegionClick);
          }
        });
      }, 200); // Give time for the layer to be fully added to DOM
      
      // Check if we've recently applied a floor plan to this drawing
      const lastApplied = floorPlanApplied.get(drawing.id) || 0;
      const shouldApply = now - lastApplied > 3000; // 3 seconds debounce
      
      // Check if this drawing has a floor plan
      const hasFloorPlanResult = await hasFloorPlan(drawing.id);
      console.log(`Drawing ${drawing.id} has floor plan: ${hasFloorPlanResult}`);
      
      // Add a small delay before applying clip mask to ensure the path is rendered
      if (hasFloorPlanResult && isMounted && shouldApply) {
        floorPlanApplied.set(drawing.id, now);
        
        // Apply with increasing timeouts to ensure SVG is ready
        const attemptApplication = (attempt = 1) => {
          if (attempt > 3 || !isMounted) return;
          
          console.log(`Attempting to apply clip mask for ${drawing.id}, attempt ${attempt}`);
          
          setTimeout(() => {
            // Apply clip mask if a floor plan exists
            if (isMounted) {
              applyClipMaskToDrawing({
                drawingId: drawing.id,
                isMounted,
                layer
              }).then(success => {
                if (!success && isMounted) {
                  console.log(`Attempt ${attempt} failed, trying again with longer timeout`);
                  attemptApplication(attempt + 1);
                } else if (success) {
                  console.log(`Successfully applied clip mask on attempt ${attempt}`);
                  // Force an update
                  window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
                    detail: { drawingId: drawing.id }
                  }));
                }
              });
            }
          }, 300 * attempt); // Increasing delay with each attempt
        };
        
        attemptApplication();
      }
    }
  } catch (err) {
    console.error('Error creating layer for drawing:', err);
  }
};
