
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { setupLayerClickHandlers } from './LayerEventHandlers';
import { createUploadButtonControl } from './controls/UploadButtonControl';
import { createRemoveButtonControl } from './controls/RemoveButtonControl';
import { createImageControls } from './controls/ImageControls';
import { getCurrentUser } from '@/services/auth-service';
import { getFloorPlan } from '@/utils/floor-plan-utils';

interface LayerCreatorProps {
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
}: LayerCreatorProps): void => {
  if (!drawing || !drawing.data || !isMounted) return;
  
  const currentUser = getCurrentUser();
  if (!currentUser || drawing.userId !== currentUser.id) {
    console.log(`Skipping layer creation for drawing ${drawing.id} - not owned by current user`);
    return;
  }
  
  try {
    console.log(`Creating layer for drawing: ${drawing.id}`);
    
    // Parse the drawing data
    const geoJsonData = typeof drawing.data === 'string' ? JSON.parse(drawing.data) : drawing.data;
    
    // Create the layer from GeoJSON
    const layer = L.geoJSON(geoJsonData, {
      style: {
        color: drawing.style?.color || '#3388ff',
        weight: drawing.style?.weight || 3,
        opacity: drawing.style?.opacity || 0.8,
        fillColor: drawing.style?.fillColor || '#3388ff',
        fillOpacity: drawing.style?.fillOpacity || 0.2,
        // Add interactive styling
        className: `drawing-layer drawing-${drawing.id}`
      }
    });
    
    // Store the drawing ID and user ID on the layer for reference
    (layer as any).drawingId = drawing.id;
    (layer as any).userId = drawing.userId;
    (layer as any).options = {
      ...(layer as any).options,
      id: drawing.id,
      isDrawn: true,
      interactive: true
    };
    
    // Set up click handlers with upload functionality
    setupLayerClickHandlers(layer, drawing, isMounted, onRegionClick, onUploadRequest);
    
    // Add the layer to the feature group
    featureGroup.addLayer(layer);
    layersRef.set(drawing.id, layer);
    
    // Create control buttons if in edit mode
    if (activeTool === 'edit') {
      // Get the bounds of the layer to position buttons
      const bounds = layer.getBounds();
      if (bounds && bounds.isValid()) {
        const center = bounds.getCenter();
        
        // Create remove button
        if (onRemoveShape) {
          createRemoveButtonControl({
            drawingId: drawing.id,
            removeButtonPosition: center,
            featureGroup,
            removeButtonRoots,
            isMounted,
            onRemoveShape
          });
        }
        
        // Create upload button
        if (onUploadRequest) {
          // Position upload button slightly offset from remove button
          const uploadPosition = L.latLng(center.lat + 0.0001, center.lng + 0.0001);
          createUploadButtonControl({
            drawingId: drawing.id,
            uploadButtonPosition: uploadPosition,
            featureGroup,
            uploadButtonRoots,
            isMounted,
            onUploadRequest
          });
        }
        
        // Create image controls if there's a floor plan
        const floorPlan = getFloorPlan(drawing.id);
        if (floorPlan) {
          const imageControlPosition = L.latLng(center.lat - 0.0001, center.lng - 0.0001);
          createImageControls({
            drawingId: drawing.id,
            imageControlPosition,
            featureGroup,
            imageControlRoots,
            isMounted
          });
        }
      }
    }
    
    console.log(`Successfully created layer for drawing: ${drawing.id}`);
  } catch (error) {
    console.error(`Error creating layer for drawing ${drawing.id}:`, error);
  }
};
