
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';

/**
 * Prepares options for drawing layers
 */
export const prepareLayerOptions = (drawing: DrawingData): L.PathOptions => {
  const drawingsWithFloorPlans = getDrawingIdsWithFloorPlans();
  const hasFloorPlan = drawingsWithFloorPlans.includes(drawing.id);
  
  const options = getDefaultDrawingOptions(drawing.properties.color);
  if (hasFloorPlan) {
    options.fillColor = '#3b82f6';
    options.fillOpacity = 1; // Always use full opacity for images
    options.color = '#1d4ed8';
  }
  
  // Always ensure opacity is set to visible values
  options.opacity = 1;
  if (!hasFloorPlan) {
    options.fillOpacity = options.fillOpacity || 0.2;
  }
  
  // Add custom option to store drawing ID that will be used by Leaflet internals
  (options as any).drawingId = drawing.id;
  
  return options;
};

/**
 * Get default drawing options for layers
 */
export const getDefaultDrawingOptions = (color?: string): L.PathOptions => ({
  color: color || '#3388ff',
  weight: 3,
  opacity: 0.7,
  fillOpacity: 0.3,
  renderer: L.svg(), // Force SVG renderer
  className: 'leaflet-interactive-drawing' // Add a custom class for easier selection
});

/**
 * Creates a drawing layer from GeoJSON and applies options
 */
export const createGeoJSONLayer = (drawing: DrawingData, options: L.PathOptions): L.GeoJSON | null => {
  try {
    // Create a copy of options without renderer for GeoJSON
    const geoJSONOptions = { ...options };
    // Remove renderer from GeoJSON options as it's not a valid property
    if ('renderer' in geoJSONOptions) {
      delete geoJSONOptions.renderer;
    }
    
    // Create layer with corrected options
    const layer = L.geoJSON(drawing.geoJSON, geoJSONOptions);
    
    // After creation, apply SVG renderer to each layer
    layer.eachLayer((l: any) => {
      if (l && l.options) {
        // Apply SVG renderer to the layer options
        l.options.renderer = L.svg();
      }
      
      // Store SVG path data if available
      if (drawing.svgPath && l._path) {
        try {
          console.log(`Setting SVG path data for drawing ${drawing.id}`);
          l._path.setAttribute('d', drawing.svgPath);
          
          // Store the path data as a backup
          l._path.setAttribute('data-original-path', drawing.svgPath);
          
          // Force the browser to acknowledge the path by triggering a reflow
          l._path.getBoundingClientRect();
        } catch (err) {
          console.error('Error setting path data:', err);
        }
      }
    });
    
    return layer;
  } catch (error) {
    console.error('Error creating drawing layer:', error);
    return null;
  }
};

/**
 * Adds drawing ID attributes to SVG paths in a layer
 */
export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  if (!layer) return;

  try {
    // Check for SVG path element in the layer
    if ((layer as any)._path) {
      const path = (layer as any)._path;
      console.log(`Setting data-drawing-id=${drawingId} on path element`);
      
      // Add multiple ways to identify this path
      path.setAttribute('data-drawing-id', drawingId);
      path.classList.add('drawing-path-' + drawingId.substring(0, 8));
      path.id = `drawing-path-${drawingId}`;
      
      // Force browser to recognize the attribute by triggering a reflow
      path.getBoundingClientRect();
      
      // Make sure we also add ID on the parent element if it exists
      if (path.parentElement) {
        path.parentElement.setAttribute('data-drawing-container', drawingId);
        path.parentElement.id = `drawing-container-${drawingId}`;
      }
    }

    // If it's a feature group, process each layer
    if (typeof (layer as any).eachLayer === 'function') {
      (layer as any).eachLayer((subLayer: L.Layer) => {
        if ((subLayer as any)._path) {
          const path = (subLayer as any)._path;
          console.log(`Setting data-drawing-id=${drawingId} on sub-path element`);
          
          // Add multiple ways to identify this path
          path.setAttribute('data-drawing-id', drawingId);
          path.classList.add('drawing-path-' + drawingId.substring(0, 8));
          path.id = `drawing-path-${drawingId}`;
          
          path.getBoundingClientRect();
          
          // Make sure we also add ID on the parent element if it exists
          if (path.parentElement) {
            path.parentElement.setAttribute('data-drawing-container', drawingId);
            path.parentElement.id = `drawing-container-${drawingId}`;
          }
        }
      });
    }
  } catch (err) {
    console.error('Error adding drawing attributes to layer:', err);
  }
};

/**
 * Checks if a drawing has a floor plan
 */
export const hasFloorPlan = (drawingId: string): boolean => {
  const drawingsWithFloorPlans = getDrawingIdsWithFloorPlans();
  return drawingsWithFloorPlans.includes(drawingId);
};
