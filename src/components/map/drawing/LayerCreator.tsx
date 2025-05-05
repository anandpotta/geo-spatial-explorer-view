
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { createLayerControls } from './LayerControls';
import { setupLayerEvents } from './LayerEventHandlers';

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
  onClearAll?: () => void;
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
  onUploadRequest,
  onClearAll
}: LayerCreatorProps) => {
  try {
    const getLayerFromDrawing = (drawing: DrawingData): L.Layer | null => {
      if (!drawing || !drawing.type || !drawing.coordinates) {
        console.warn("Invalid drawing data, cannot create layer");
        return null;
      }
      
      try {
        // Create GeoJSON object from drawing data
        const geoJson = drawing.geoJSON || {
          type: "Feature",
          properties: drawing.properties,
          geometry: {
            type: drawing.type === 'circle' ? 'Point' : 'Polygon',
            coordinates: drawing.coordinates
          }
        };
        
        if (!geoJson || typeof geoJson !== 'object') {
          console.warn("Invalid GeoJSON data, cannot create layer");
          return null;
        }
        
        let layer: L.Layer | null = null;
        
        switch (drawing.type) {
          case 'rectangle':
            layer = L.rectangle(drawing.coordinates as any, drawing.properties);
            break;
          case 'polygon':
            layer = L.polygon(drawing.coordinates, drawing.properties);
            break;
          case 'circle':
            // For circle, first coordinate is center, properties should contain radius
            const radius = drawing.properties?.radius || 500; // Default radius if not specified
            layer = L.circle(drawing.coordinates[0], {
              ...drawing.properties,
              radius
            });
            break;
          case 'marker':
            layer = L.marker(drawing.coordinates[0], drawing.properties);
            break;
          default:
            console.warn(`Unsupported shape type: ${drawing.type}`);
            return null;
        }
        
        return layer;
      } catch (error) {
        console.error("Error parsing GeoJSON or creating layer:", error);
        return null;
      }
    };
    
    // Create the layer
    let layer;
    
    layer = getLayerFromDrawing(drawing);
    
    if (layer) {
      // Attach the drawing ID to the layer
      (layer as any).drawingId = drawing.id;
      
      // Add the layer to the feature group
      featureGroup.addLayer(layer);
      
      // Store the layer in the layers reference map
      layersRef.set(drawing.id, layer);
      
      // Set up layer events
      if (onRegionClick) {
        setupLayerEvents(layer, drawing, onRegionClick);
      }
      
      // Create layer controls
      createLayerControls({
        layer,
        drawingId: drawing.id,
        activeTool,
        featureGroup,
        uploadButtonRoots,
        removeButtonRoots,
        imageControlRoots,
        isMounted,
        onUploadRequest: (id) => {
          if (onUploadRequest) onUploadRequest(id);
        },
        onRemoveShape: (id) => {
          if (onRemoveShape) onRemoveShape(id);
        },
        onClearAll
      });
      
      // Apply any clip masks or other post-processing
      setTimeout(() => {
        const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
        const floorPlan = floorPlans[drawing.id];
        
        if (floorPlan && floorPlan.data) {
          window.dispatchEvent(new CustomEvent('floorPlanUpdated', { detail: { drawingId: drawing.id } }));
        }
      }, 100);
    }
  } catch (error) {
    console.error('Error creating layer from drawing:', error);
  }
};
