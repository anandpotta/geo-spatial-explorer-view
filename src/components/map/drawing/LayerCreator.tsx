
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
    console.log(`Creating interactive layer for drawing: ${drawing.id}`);
    
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
        interactive: true,
        className: `drawing-layer drawing-${drawing.id}`
      },
      // Make sure each feature is interactive
      onEachFeature: (feature, featureLayer) => {
        // Ensure the layer is interactive with proper casting
        if ('setStyle' in featureLayer && typeof (featureLayer as any).setStyle === 'function') {
          (featureLayer as any).setStyle({
            interactive: true,
            bubblingMouseEvents: false,
            pane: 'overlayPane'
          });
        }
        
        // Set up direct click handler on each feature
        const handleFeatureClick = (e: L.LeafletMouseEvent) => {
          console.log(`Feature clicked directly for drawing: ${drawing.id}`);
          
          // Stop all propagation
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
            e.originalEvent.preventDefault();
          }
          L.DomEvent.stop(e);
          
          // Always trigger upload request on feature click
          if (onUploadRequest) {
            console.log(`Triggering upload request for drawing: ${drawing.id}`);
            onUploadRequest(drawing.id);
          }
        };
        
        const handleFeatureContextMenu = (e: L.LeafletMouseEvent) => {
          console.log(`Feature context menu for drawing: ${drawing.id}`);
          
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
            e.originalEvent.preventDefault();
          }
          L.DomEvent.stop(e);
          
          if (onUploadRequest) {
            console.log(`Context menu upload request for drawing: ${drawing.id}`);
            onUploadRequest(drawing.id);
          }
        };
        
        // Remove any existing handlers
        featureLayer.off('click');
        featureLayer.off('contextmenu');
        
        // Add new handlers
        featureLayer.on('click', handleFeatureClick);
        featureLayer.on('contextmenu', handleFeatureContextMenu);
        
        // Ensure DOM element is properly configured for interaction
        featureLayer.on('add', () => {
          const element = (featureLayer as any)._path;
          if (element) {
            element.style.pointerEvents = 'all';
            element.style.cursor = 'pointer';
            element.classList.add('leaflet-interactive');
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
    
    // Set up additional click handlers using the existing system
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
    
    console.log(`Successfully created interactive layer for drawing: ${drawing.id} with upload handlers`);
  } catch (error) {
    console.error(`Error creating layer for drawing ${drawing.id}:`, error);
  }
};
