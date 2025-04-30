
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing/types';
import { getDefaultDrawingOptions, createDrawingLayer } from '@/utils/leaflet-drawing-config';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { getSavedMarkers } from '@/utils/marker-utils';
import { applyImageToSvgPath } from './svg-image-utils';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';

/**
 * Creates and configures a Leaflet layer from a drawing object
 */
export const createLayerFromDrawingData = ({
  drawing,
  featureGroup,
  isMounted
}: {
  drawing: DrawingData;
  featureGroup: L.FeatureGroup;
  isMounted: boolean;
}): L.Layer | null => {
  if (!drawing.geoJSON || !isMounted) return null;

  try {
    // Check if the feature group is attached to a valid map
    const map = getMapFromLayer(featureGroup);
    if (!isMapValid(map)) {
      console.warn("No valid map attached to feature group, skipping layer creation");
      return null;
    }

    const markers = getSavedMarkers();
    const drawingsWithFloorPlans = getDrawingIdsWithFloorPlans();
    
    const associatedMarker = markers.find(m => m.associatedDrawing === drawing.id);
    const hasFloorPlan = drawingsWithFloorPlans.includes(drawing.id);
    
    const options = getDefaultDrawingOptions(drawing.properties.color);
    if (hasFloorPlan) {
      options.fillColor = '#3b82f6';
      options.fillOpacity = 0.4;
      options.color = '#1d4ed8';
    }
    
    // Special handling for masked images
    if (drawing.maskedImage) {
      // Use the patternOptions in a way TypeScript understands
      (options as any).fillPattern = {
        url: drawing.maskedImage.src,
        pattern: true
      };
      options.fillOpacity = 1;
    }
    
    // Always ensure opacity is set to visible values
    options.opacity = 1;
    options.fillOpacity = options.fillOpacity || 0.2;
    
    // Force SVG renderer for all layers
    options.renderer = L.svg();
    
    const layer = createDrawingLayer(drawing, options);
    return layer;
  } catch (err) {
    console.error('Error creating drawing layer:', err);
    return null;
  }
}

/**
 * Prepares a layer with properties and attributes needed for drawing and editing
 */
export const prepareLayerForDrawing = (
  layer: L.Layer, 
  drawingId: string
) => {
  if (!layer) return;
  
  // Store drawing ID on the layer for reference
  (layer as any).drawingId = drawingId;
  
  // Ensure each layer has editing capability
  if (layer instanceof L.Path && !(layer as any).editing) {
    (layer as any).editing = new (L.Handler as any).PolyEdit(layer);
  }
};

/**
 * Sets up SVG path attributes for a layer
 */
export const setupSvgPathAttributes = (
  layer: L.Layer,
  drawing: DrawingData
) => {
  if ((layer as any)._path) {
    (layer as any)._path.setAttribute('data-drawing-id', drawing.id);
    
    // If we have SVG path data but it's not set yet, set it manually
    if (drawing.svgPath && (layer as any)._path.getAttribute('d') !== drawing.svgPath) {
      (layer as any)._path.setAttribute('d', drawing.svgPath);
    }
    
    // Apply masked image if available
    if (drawing.maskedImage && drawing.maskedImage.src) {
      applyImageToSvgPath((layer as any)._path, drawing.maskedImage.src);
    }
  }
};
