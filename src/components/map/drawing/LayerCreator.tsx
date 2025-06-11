
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { setupLayerClickHandlers } from './LayerEventHandlers';
import { createUploadButtonControl } from './controls/UploadButtonControl';
import { createRemoveButtonControl } from './controls/RemoveButtonControl';
import { createImageControlsLayer } from './controls/ImageControlsLayer';
import { getCurrentUser } from '@/services/auth-service';
import { getFloorPlanById } from '@/utils/floor-plan-utils';

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
  if (!drawing || !drawing.geoJSON || !isMounted) return;
  
  const currentUser = getCurrentUser();
  if (!currentUser || drawing.userId !== currentUser.id) {
    console.log(`Skipping layer creation for drawing ${drawing.id} - not owned by current user`);
    return;
  }
  
  try {
    console.log(`Creating layer for drawing: ${drawing.id}`);
    
    // Parse the drawing data
    const geoJsonData = typeof drawing.geoJSON === 'string' ? JSON.parse(drawing.geoJSON) : drawing.geoJSON;
    
    // Create the layer from GeoJSON with enhanced interactivity
    const layer = L.geoJSON(geoJsonData, {
      style: {
        color: '#3388ff',
        weight: 3,
        opacity: 0.8,
        fillColor: '#3388ff',
        fillOpacity: 0.2,
        // Add interactive styling
        className: `drawing-layer drawing-${drawing.id}`
      },
      // Make sure each feature is interactive
      onEachFeature: (feature, layer) => {
        // Ensure the layer is interactive
        if (layer.setStyle) {
          layer.setStyle({
            interactive: true,
            bubblingMouseEvents: false
          });
        }
        
        // Add click handler directly to each feature
        layer.on('click', (e) => {
          console.log(`Feature clicked for drawing: ${drawing.id}`);
          L.DomEvent.stopPropagation(e);
          
          // Check for upload request (right-click, ctrl+click, or cmd+click)
          const isUploadRequest = e.originalEvent && (
            (e.originalEvent as MouseEvent).ctrlKey || 
            (e.originalEvent as MouseEvent).button === 2 || 
            (e.originalEvent as MouseEvent).metaKey
          );
          
          if (isUploadRequest && onUploadRequest) {
            console.log(`Upload request triggered for drawing: ${drawing.id}`);
            onUploadRequest(drawing.id);
          } else if (onRegionClick) {
            console.log(`Region click triggered for drawing: ${drawing.id}`);
            onRegionClick(drawing);
          }
        });
        
        // Add context menu handler for right-click upload
        layer.on('contextmenu', (e) => {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);
          
          if (onUploadRequest) {
            console.log(`Context menu upload for drawing: ${drawing.id}`);
            onUploadRequest(drawing.id);
          }
        });
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
    
    // Set up additional click handlers
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
            layer,
            drawingId: drawing.id,
            buttonPosition: center,
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
        const checkFloorPlan = async () => {
          const floorPlan = await getFloorPlanById(drawing.id);
          if (floorPlan) {
            const imageControlPosition = L.latLng(center.lat - 0.0001, center.lng - 0.0001);
            createImageControlsLayer({
              drawingId: drawing.id,
              imageControlsPosition: imageControlPosition,
              featureGroup,
              imageControlRoots,
              isMounted,
              onRemoveShape: onRemoveShape || (() => {})
            });
          }
        };
        checkFloorPlan();
      }
    }
    
    console.log(`Successfully created layer for drawing: ${drawing.id}`);
  } catch (error) {
    console.error(`Error creating layer for drawing ${drawing.id}:`, error);
  }
};
