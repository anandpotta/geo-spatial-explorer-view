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
      
      // Enhanced floor plan checking and application with better timing
      console.log(`🔍 LayerCreator: Checking for floor plan for drawing ${drawing.id}`);
      
      // Wait a bit longer before checking for floor plans to ensure DOM is stable
      setTimeout(async () => {
        if (!isMounted) return;
        
        try {
          // Check if this drawing has a floor plan with better debugging
          const hasFloorPlanResult = await hasFloorPlan(drawing.id);
          console.log(`📋 LayerCreator: Drawing ${drawing.id} has floor plan: ${hasFloorPlanResult}`);
          
          if (hasFloorPlanResult) {
            // Get the actual floor plan data
            const floorPlanData = await getFloorPlanById(drawing.id);
            console.log(`📋 LayerCreator: Floor plan data retrieved:`, {
              hasData: !!floorPlanData,
              hasImageData: !!(floorPlanData?.data),
              dataLength: floorPlanData?.data?.length || 0
            });
            
            if (floorPlanData && floorPlanData.data) {
              const currentUser = getCurrentUser();
              
              // Check if we've recently applied a floor plan to this drawing
              const lastApplied = floorPlanApplied.get(drawing.id) || 0;
              const shouldApply = now - lastApplied > 2000; // 2 seconds debounce
              
              if (shouldApply && isMounted) {
                floorPlanApplied.set(drawing.id, now);
                
                console.log(`🎨 LayerCreator: Triggering floor plan application for drawing ${drawing.id}`);
                
                // Instead of applying directly, trigger the floor plan updated event
                // This ensures the useSvgPathManagement hook handles it properly
                setTimeout(() => {
                  if (isMounted) {
                    console.log(`🚀 LayerCreator: Dispatching floorPlanUpdated event for ${drawing.id}`);
                    window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
                      detail: { 
                        drawingId: drawing.id,
                        success: false, // Set to false to trigger processing
                        freshlyUploaded: true,
                        retryNeeded: false,
                        userId: currentUser?.id || 'anonymous'
                      }
                    }));
                  }
                }, 1500); // Give more time for DOM to settle
              } else {
                console.log(`⏭️ LayerCreator: Skipping floor plan application for ${drawing.id} (debounced or unmounted)`);
              }
            } else {
              console.warn(`⚠️ LayerCreator: Floor plan exists but no data found for ${drawing.id}`);
            }
          } else {
            console.log(`ℹ️ LayerCreator: No floor plan found for drawing ${drawing.id}`);
          }
        } catch (error) {
          console.error(`❌ LayerCreator: Error checking/applying floor plan for ${drawing.id}:`, error);
        }
      }, 2000); // Increased delay to ensure everything is ready
    }
  } catch (err) {
    console.error('❌ LayerCreator: Error creating layer for drawing:', err);
  }
};
