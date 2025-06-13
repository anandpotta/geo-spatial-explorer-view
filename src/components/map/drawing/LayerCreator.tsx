
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';
import { getSavedMarkers } from '@/utils/marker-utils';
import { createLayerControls } from './LayerControls';
import { toast } from 'sonner';
import { prepareLayerOptions, createGeoJSONLayer, addDrawingAttributesToLayer } from './LayerUtils';
import { setupLayerClickHandlers } from './LayerEventHandlers';
import { applyClipMaskToDrawing } from './clip-mask';
import { hasFloorPlan, getFloorPlanById } from '@/utils/floor-plan-utils';
import { getCurrentUser } from '@/services/auth-service';

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
const floorPlanChecked = new Map<string, number>();

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
      console.log(`Layer for drawing ${drawing.id} already exists, checking for floor plan...`);
      
      // Even if layer exists, check for floor plan application
      setTimeout(async () => {
        if (isMounted) {
          await checkAndApplyFloorPlan(drawing.id, isMounted);
        }
      }, 1000);
      
      return;
    }

    console.log(`🏗️ LayerCreator: Creating new layer for drawing ${drawing.id}`);

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
        
        // Store the layer reference
        layersRef.set(drawing.id, l);
      }
    });
    
    // Add the layer to the feature group
    if (isMounted && layer) {
      featureGroup.addLayer(layer);
      
      console.log(`✅ LayerCreator: Successfully added layer for drawing ${drawing.id} to feature group`);
      
      // Apply drawing attributes immediately after adding to feature group
      layer.eachLayer((l: L.Layer) => {
        if (l && isMounted) {
          addDrawingAttributesToLayer(l, drawing.id);
        }
      });
      
      // Add controls and event handlers
      setTimeout(() => {
        if (!isMounted) return;
        
        layer.eachLayer((l: L.Layer) => {
          if (l && isMounted) {
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
      }, 500);
      
      // Check for floor plan after layer is fully created
      setTimeout(async () => {
        if (isMounted) {
          await checkAndApplyFloorPlan(drawing.id, isMounted);
        }
      }, 1500); // Increased delay to ensure DOM is fully ready
    }
  } catch (err) {
    console.error('❌ LayerCreator: Error creating layer for drawing:', err);
  }
};

// Helper function to check and apply floor plan
async function checkAndApplyFloorPlan(drawingId: string, isMounted: boolean) {
  if (!isMounted) return;
  
  const now = Date.now();
  const lastChecked = floorPlanChecked.get(drawingId) || 0;
  
  // Debounce floor plan checks
  if (now - lastChecked < 2000) {
    console.log(`⏭️ LayerCreator: Skipping floor plan check for ${drawingId} (debounced)`);
    return;
  }
  
  floorPlanChecked.set(drawingId, now);
  
  try {
    console.log(`🔍 LayerCreator: Checking for floor plan for drawing ${drawingId}`);
    
    const hasFloorPlanResult = await hasFloorPlan(drawingId);
    console.log(`📋 LayerCreator: Drawing ${drawingId} has floor plan: ${hasFloorPlanResult}`);
    
    if (hasFloorPlanResult) {
      const floorPlanData = await getFloorPlanById(drawingId);
      console.log(`📋 LayerCreator: Floor plan data retrieved:`, {
        hasData: !!floorPlanData,
        hasImageData: !!(floorPlanData?.data),
        dataLength: floorPlanData?.data?.length || 0
      });
      
      if (floorPlanData && floorPlanData.data && isMounted) {
        const currentUser = getCurrentUser();
        
        console.log(`🚀 LayerCreator: Dispatching floorPlanUpdated event for ${drawingId}`);
        window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
          detail: { 
            drawingId: drawingId,
            success: false, // Set to false to trigger processing
            freshlyUploaded: true,
            retryNeeded: false,
            userId: currentUser?.id || 'anonymous'
          }
        }));
        
        console.log(`Floor plan updated for drawing ${drawingId}, triggering refresh`);
      } else {
        console.warn(`⚠️ LayerCreator: Floor plan exists but no data found for ${drawingId}`);
      }
    } else {
      console.log(`ℹ️ LayerCreator: No floor plan found for drawing ${drawingId}`);
    }
  } catch (error) {
    console.error(`❌ LayerCreator: Error checking/applying floor plan for ${drawingId}:`, error);
  }
}
