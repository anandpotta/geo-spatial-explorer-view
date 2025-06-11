
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';

export function createLayerFromDrawingData(drawing: DrawingData): L.Layer | null {
  console.log(`Creating layer for drawing: ${drawing.id}, type: ${drawing.type}`);
  
  let layer: L.Layer | null = null;

  if (drawing.type === 'polygon') {
    layer = L.polygon(drawing.coordinates as L.LatLngExpression[]);
  } else if (drawing.type === 'rectangle') {
    layer = L.rectangle(drawing.coordinates as L.LatLngBoundsExpression);
  } else if (drawing.type === 'circle') {
    const coords = drawing.coordinates as any;
    if (Array.isArray(coords) && coords.length >= 2) {
      const [center, radius] = coords;
      layer = L.circle(center as L.LatLngExpression, { radius: radius as number });
    }
  } else if (drawing.type === 'marker') {
    const coords = drawing.coordinates as any;
    if (Array.isArray(coords) && coords.length >= 2) {
      layer = L.marker([coords[0], coords[1]] as L.LatLngExpression);
    }
  }

  if (!layer) {
    console.error(`Could not create layer for drawing type: ${drawing.type}`);
    return null;
  }

  // Set up the layer with proper identification
  (layer as any).options = {
    ...(layer as any).options,
    id: drawing.id,
    isDrawn: true,
    drawingId: drawing.id
  };

  return layer;
}
