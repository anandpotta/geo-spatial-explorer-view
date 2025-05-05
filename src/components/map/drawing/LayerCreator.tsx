
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
        
        // Add ID to options for all layer types
        const options = {
          ...(drawing.properties || {}),
          drawingId: drawing.id
        };
        
        switch (drawing.type) {
          case 'rectangle':
            layer = L.rectangle(drawing.coordinates as any, options);
            break;
          case 'polygon':
            layer = L.polygon(drawing.coordinates, options);
            break;
          case 'circle':
            // For circle, first coordinate is center, properties should contain radius
            // Create circle options with radius explicitly defined
            const circleOptions = {
              ...options,
              radius: 500 // Default radius if not specified
            };
            
            // Check if radius is defined in properties or geoJSON
            if (drawing.properties && 'radius' in drawing.properties) {
              circleOptions.radius = (drawing.properties as any).radius;
            } else if (geoJson.properties && 'radius' in geoJson.properties) {
              circleOptions.radius = geoJson.properties.radius;
            }
            
            layer = L.circle(drawing.coordinates[0], circleOptions);
            break;
          case 'marker':
            // Create proper marker options from properties
            const markerOptions: L.MarkerOptions = {
              ...options
            };
            
            layer = L.marker(drawing.coordinates[0], markerOptions);
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
    let layer = getLayerFromDrawing(drawing);
    
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
      
      // Add drawing ID to the SVG path element if it exists
      setTimeout(() => {
        try {
          if ((layer as any)._path) {
            const path = (layer as any)._path as SVGPathElement;
            path.setAttribute('data-drawing-id', drawing.id);
          }
        } catch (err) {
          console.warn('Error setting path attributes:', err);
        }
      }, 50);
      
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
