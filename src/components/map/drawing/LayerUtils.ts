
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';

/**
 * Prepare layer options for a drawing
 */
export const prepareLayerOptions = async (drawing: DrawingData) => {
  const color = drawing.properties?.color || '#3388ff';
  const fillColor = drawing.properties?.fillColor || color;
  const opacity = drawing.properties?.opacity !== undefined ? drawing.properties.opacity : 0.8;
  const fillOpacity = drawing.properties?.fillOpacity !== undefined ? drawing.properties.fillOpacity : 0.2;
  
  return {
    style: {
      color,
      weight: 3,
      opacity,
      fillColor,
      fillOpacity,
      className: `drawing-layer drawing-${drawing.id}`
    }
  };
};

/**
 * Create a GeoJSON layer from drawing data
 */
export const createGeoJSONLayer = (drawing: DrawingData, options: any): L.GeoJSON | null => {
  if (!drawing.geoJSON) return null;
  
  try {
    return L.geoJSON(drawing.geoJSON, options);
  } catch (err) {
    console.error(`Failed to create GeoJSON layer for drawing ${drawing.id}:`, err);
    return null;
  }
};

/**
 * Add drawing attributes to a layer's DOM elements
 */
export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string) => {
  try {
    // For path layers, we can add attributes to the SVG path element
    if (layer instanceof L.Path) {
      const pathElement = layer.getElement();
      if (pathElement) {
        // Set multiple attributes for more reliable selection later
        pathElement.setAttribute('data-drawing-id', drawingId);
        pathElement.setAttribute('data-id', drawingId);
        pathElement.id = `path-${drawingId}`;
        pathElement.classList.add(`drawing-${drawingId}`);
        
        // Store the drawing ID on the DOM element for debugging
        (pathElement as any).drawingId = drawingId;
      }
    }
    
    // Store drawing ID on the layer itself
    (layer as any).drawingId = drawingId;
  } catch (err) {
    console.error(`Error adding attributes to layer for drawing ${drawingId}:`, err);
  }
};
