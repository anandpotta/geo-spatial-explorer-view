
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getDefaultDrawingOptions, createDrawingLayer } from '@/utils/leaflet-drawing-config';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { getSavedMarkers } from '@/utils/marker-utils';
import { createLayerControls } from './LayerControls';
import { toast } from 'sonner';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';
import { applyImageClipMask, findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
import { debugSvgElement } from '@/utils/svg-debug-utils';

interface CreateLayerOptions {
  drawing: DrawingData;
  featureGroup: L.FeatureGroup;
  activeTool: string | null;
  isMounted: boolean;
  layersRef: Map<string, L.Layer>;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
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

    const markers = getSavedMarkers();
    const drawingsWithFloorPlans = getDrawingIdsWithFloorPlans();
    
    const associatedMarker = markers.find(m => m.associatedDrawing === drawing.id);
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
    
    const layer = createDrawingLayer(drawing, options);
    
    if (layer) {
      layer.eachLayer((l: L.Layer) => {
        if (l && isMounted) {
          (l as any).drawingId = drawing.id;
          
          // Add drawing ID attribute to the SVG path for identification
          if ((l as any)._path) {
            console.log(`Setting data-drawing-id=${drawing.id} on path element`);
            (l as any)._path.setAttribute('data-drawing-id', drawing.id);
            
            // Force browser to recognize the attribute by triggering a reflow
            (l as any)._path.getBoundingClientRect();
          }
          
          // Store the layer reference
          layersRef.set(drawing.id, l);
          
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
          
          // Apply clip mask if a floor plan exists
          if (hasFloorPlan) {
            console.log(`Drawing ${drawing.id} has a floor plan, will try to apply clip mask`);
            
            // Use a retry mechanism for applying clip masks
            const maxRetries = 15;
            let currentRetry = 0;
            
            const attemptApplyClipMask = () => {
              if (!isMounted) return;
              
              try {
                // Try to find the path element using enhanced finder
                const pathElement = findSvgPathByDrawingId(drawing.id);
                
                if (pathElement) {
                  console.log(`Found path element for drawing ${drawing.id}`);
                  debugSvgElement(pathElement, `Drawing ${drawing.id}`);
                  
                  // Get floor plan data from localStorage
                  const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
                  const floorPlan = floorPlans[drawing.id];
                  
                  if (floorPlan && floorPlan.data) {
                    console.log(`Found floor plan data for drawing ${drawing.id}`);
                    
                    // Apply image as clip mask
                    const result = applyImageClipMask(
                      pathElement,
                      floorPlan.data,
                      drawing.id
                    );
                    
                    if (result) {
                      console.log(`Successfully applied clip mask for drawing ${drawing.id}`);
                      // Debug the SVG element after applying clip mask
                      debugSvgElement(pathElement, `Drawing ${drawing.id} after clip mask`);
                      
                      // Force redraw after mask applied
                      setTimeout(() => {
                        try {
                          window.dispatchEvent(new Event('resize'));
                        } catch (e) {
                          console.error("Error dispatching resize event:", e);
                        }
                      }, 100);
                    } else {
                      console.error(`Failed to apply clip mask for drawing ${drawing.id}`);
                      
                      // Try again with a delay if not successful
                      if (currentRetry < maxRetries) {
                        currentRetry++;
                        setTimeout(attemptApplyClipMask, 300 * Math.min(currentRetry, 3));
                      }
                    }
                  } else {
                    console.log(`No floor plan data found for drawing ${drawing.id}`);
                  }
                } else {
                  console.error(`Path element not found for drawing ${drawing.id}`);
                  
                  // Try again with a delay if path element not found
                  if (currentRetry < maxRetries) {
                    currentRetry++;
                    console.log(`Retrying to find path element for drawing ${drawing.id} (Attempt ${currentRetry} of ${maxRetries})`);
                    setTimeout(attemptApplyClipMask, 300 * Math.min(currentRetry, 3));
                  }
                }
              } catch (err) {
                console.error('Error restoring clip mask:', err);
                
                // Try again on error
                if (currentRetry < maxRetries) {
                  currentRetry++;
                  setTimeout(attemptApplyClipMask, 300 * Math.min(currentRetry, 3));
                }
              }
            };
            
            // Start the retry process with an initial delay
            setTimeout(attemptApplyClipMask, 300);
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
