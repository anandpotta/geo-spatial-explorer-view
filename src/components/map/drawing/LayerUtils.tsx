
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getFloorPlanById } from '@/utils/floor-plan-utils';

export const prepareLayerOptions = async (drawing: DrawingData) => {
  const options: any = {
    style: {
      color: drawing.properties?.color || '#3388ff',
      weight: 3,
      opacity: 0.8,
      fillOpacity: 0.3
    }
  };

  // Check if there's a floor plan for this drawing
  const floorPlan = await getFloorPlanById(drawing.id);
  if (floorPlan && !floorPlan.isPdf) {
    // Reduce opacity when there's a floor plan image
    options.style.fillOpacity = 0.1;
    options.style.opacity = 0.5;
  }

  return options;
};

export const createGeoJSONLayer = (drawing: DrawingData, options: any) => {
  if (!drawing.geoJSON) return null;
  
  return L.geoJSON(drawing.geoJSON, {
    ...options,
    // Add unique identifier to the layer
    drawingId: drawing.id,
    uniqueId: `drawing-${drawing.id}-${Date.now()}`
  });
};

export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string) => {
  // Generate unique identifier for this specific layer instance
  const uniqueId = `drawing-${drawingId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  if ((layer as any)._path) {
    const pathElement = (layer as any)._path as SVGPathElement;
    
    // Add multiple identifiers for robust tracking
    pathElement.setAttribute('data-drawing-id', drawingId);
    pathElement.setAttribute('data-unique-id', uniqueId);
    pathElement.setAttribute('id', `drawing-path-${drawingId}`);
    pathElement.classList.add('drawing-path', `drawing-${drawingId}`);
    
    // Store the unique ID on the layer object as well
    (layer as any).uniqueId = uniqueId;
    (layer as any).drawingId = drawingId;
    
    console.log(`Added unique identifier to SVG path: ${uniqueId} for drawing: ${drawingId}`);
  }
};
