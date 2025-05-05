
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getDefaultDrawingOptions } from '@/utils/leaflet-drawing-config';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { getSavedMarkers } from '@/utils/marker-utils';

/**
 * Sets up the drawing options for a layer based on its properties
 */
export const setupDrawingOptions = (drawing: DrawingData): L.PathOptions => {
  // Use imported functions instead of requiring them
  const drawingsWithFloorPlans = getDrawingIdsWithFloorPlans();
  const markers = getSavedMarkers();
  
  const associatedMarker = markers.find((m: any) => m.associatedDrawing === drawing.id);
  const hasFloorPlan = drawingsWithFloorPlans.includes(drawing.id);
  
  const options = getDefaultDrawingOptions(drawing.properties.color);
  if (hasFloorPlan) {
    options.fillColor = '#3b82f6';
    options.fillOpacity = 0.1; // Make it more transparent to see floor plan better
    options.color = '#1d4ed8';
    options.weight = 2;
    options.className = 'has-floor-plan'; // Add a class for additional styling
  }
  
  // Always ensure opacity is set to visible values
  options.opacity = 1;
  options.fillOpacity = options.fillOpacity || 0.2;
  
  return options;
};
