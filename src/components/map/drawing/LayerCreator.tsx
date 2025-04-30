
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getDefaultDrawingOptions, createDrawingLayer } from '@/utils/leaflet-drawing-config';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { getSavedMarkers } from '@/utils/marker-utils';
import { createLayerControls } from './LayerControls';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet';

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
        } catch (err) {
          console.error('Error adding layer to featureGroup:', err);
        }
      }
    }
  } catch (err) {
    console.error('Error adding drawing layer:', err);
  }
};
