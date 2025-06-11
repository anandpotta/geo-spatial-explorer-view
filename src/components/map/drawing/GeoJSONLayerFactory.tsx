
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { addDrawingAttributesToLayer } from './LayerAttributeManager';

/**
 * Creates a drawing layer from GeoJSON and applies options with proper attribute handling
 */
export const createGeoJSONLayer = (drawing: DrawingData, options: L.PathOptions): L.GeoJSON | null => {
  try {
    console.log(`Creating GeoJSON layer for drawing ${drawing.id}`);
    
    // Enhance options to include drawing ID for path creation
    const enhancedOptions = {
      ...options,
      onEachFeature: (feature: any, layer: L.Layer) => {
        // Store drawing ID on the layer
        (layer as any).drawingId = drawing.id;
        
        // Apply attributes immediately when layer is created
        if (layer && typeof (layer as any).on === 'function') {
          // Hook into the layer's add event
          (layer as any).on('add', () => {
            addDrawingAttributesToLayer(layer, drawing.id);
          });
        }
      }
    };
    
    // Create layer with enhanced options
    const layer = L.geoJSON(drawing.geoJSON, enhancedOptions);
    
    if (!layer) {
      return null;
    }
    
    // Store the drawing ID at the layer level as well for easier reference
    (layer as any).drawingId = drawing.id;
    
    return layer;
  } catch (error) {
    console.error('Error creating drawing layer:', error);
    return null;
  }
};
