
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { hasFloorPlan as checkFloorPlan } from '@/utils/floor-plan-utils';

/**
 * Prepares options for drawing layers
 */
export const prepareLayerOptions = async (drawing: DrawingData): Promise<L.PathOptions> => {
  // Check if this drawing has a floor plan
  const hasFloorPlanApplied = await checkFloorPlan(drawing.id);
  
  const options = getDefaultDrawingOptions(drawing.properties?.color || '#33C3F0');
  if (hasFloorPlanApplied) {
    options.fillColor = '#3b82f6';
    options.fillOpacity = 1;
    options.color = '#33C3F0';
  }
  
  // Always ensure opacity is set to visible values
  options.opacity = 1;
  if (!hasFloorPlanApplied) {
    options.fillColor = '#33c3f061';
    options.fillOpacity = 1;
  }
  
  // Add custom option to store drawing ID that will be used by Leaflet internals
  (options as any).drawingId = drawing.id;
  (options as any).drawingUid = drawing.uniqueId || crypto.randomUUID();
  
  return options;
};

/**
 * Get default drawing options for layers
 */
export const getDefaultDrawingOptions = (color?: string): L.PathOptions => ({
  color: color || '#33C3F0',
  weight: 4,
  opacity: 1,
  fillColor: '#33c3f061',
  fillOpacity: 1,
  renderer: L.svg(),
  className: 'leaflet-interactive-drawing',
  stroke: true,
  lineCap: 'round',
  lineJoin: 'round'
});

/**
 * Creates a drawing layer from GeoJSON and applies options
 */
export const createGeoJSONLayer = (drawing: DrawingData, options: L.PathOptions): L.GeoJSON | null => {
  try {
    // Generate unique identifiers for this drawing layer
    const layerUid = drawing.uniqueId || crypto.randomUUID();
    const svgUid = crypto.randomUUID();
    
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
        
        // Ensure stroke is set to true for this layer
        l.options.stroke = true;
        l.options.weight = options.weight || 4;
        l.options.opacity = 1;
      }
      
      // Store SVG path data if available
      if (drawing.svgPath && l._path) {
        try {
          console.log(`Setting SVG path data for drawing ${drawing.id} with UID: ${svgUid}`);
          l._path.setAttribute('d', drawing.svgPath);
          
          // Add comprehensive UID attributes to the SVG path element
          l._path.setAttribute('data-svg-uid', svgUid);
          l._path.setAttribute('data-drawing-id', drawing.id);
          l._path.setAttribute('data-drawing-uid', layerUid);
          l._path.setAttribute('data-layer-uid', crypto.randomUUID());
          l._path.id = `svg-path-${svgUid}`;
          l._path.classList.add(`drawing-${drawing.id.substring(0, 8)}`);
          l._path.classList.add(`uid-${svgUid.substring(0, 8)}`);
          
          // Store the path data as a backup
          l._path.setAttribute('data-original-path', drawing.svgPath);
          l._path.setAttribute('data-created-at', new Date().toISOString());
          
          // Force the browser to acknowledge the path by triggering a reflow
          l._path.getBoundingClientRect();
          
          console.log(`SVG path configured with UID: ${svgUid} for drawing: ${drawing.id}`);
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
    // Generate unique identifiers for this layer
    const layerUid = crypto.randomUUID();
    const svgUid = crypto.randomUUID();
    
    // Check for SVG path element in the layer
    if ((layer as any)._path) {
      const path = (layer as any)._path;
      console.log(`Setting comprehensive UIDs for drawing ${drawingId}: layer=${layerUid}, svg=${svgUid}`);
      
      // Add comprehensive identification attributes
      path.setAttribute('data-drawing-id', drawingId);
      path.setAttribute('data-drawing-uid', layerUid);
      path.setAttribute('data-svg-uid', svgUid);
      path.setAttribute('data-layer-uid', crypto.randomUUID());
      path.setAttribute('data-path-type', 'drawing');
      path.setAttribute('data-created-timestamp', Date.now().toString());
      
      // Add CSS classes for styling and identification
      path.classList.add('drawing-path-' + drawingId.substring(0, 8));
      path.classList.add('layer-uid-' + layerUid.substring(0, 8));
      path.classList.add('svg-uid-' + svgUid.substring(0, 8));
      path.classList.add('visible-path-stroke');
      
      // Set unique ID
      path.id = `svg-path-${svgUid}`;
      
      // Force browser to recognize the attributes by triggering a reflow
      path.getBoundingClientRect();
      
      // Make sure we also add ID on the parent element if it exists
      if (path.parentElement) {
        path.parentElement.setAttribute('data-drawing-container', drawingId);
        path.parentElement.setAttribute('data-container-uid', layerUid);
        path.parentElement.setAttribute('data-parent-svg-uid', svgUid);
        path.parentElement.id = `drawing-container-${layerUid}`;
      }
    }

    // If it's a feature group, process each layer
    if (typeof (layer as any).eachLayer === 'function') {
      (layer as any).eachLayer((subLayer: L.Layer) => {
        if ((subLayer as any)._path) {
          const path = (subLayer as any)._path;
          const subLayerUid = crypto.randomUUID();
          const subSvgUid = crypto.randomUUID();
          
          console.log(`Setting sub-layer UIDs for drawing ${drawingId}: layer=${subLayerUid}, svg=${subSvgUid}`);
          
          // Add comprehensive identification attributes for sub-layers
          path.setAttribute('data-drawing-id', drawingId);
          path.setAttribute('data-drawing-uid', layerUid);
          path.setAttribute('data-sub-layer-uid', subLayerUid);
          path.setAttribute('data-svg-uid', subSvgUid);
          path.setAttribute('data-path-type', 'sub-drawing');
          path.setAttribute('data-parent-layer-uid', layerUid);
          
          // Add CSS classes
          path.classList.add('drawing-path-' + drawingId.substring(0, 8));
          path.classList.add('sub-layer-uid-' + subLayerUid.substring(0, 8));
          path.classList.add('visible-path-stroke');
          
          path.id = `svg-path-${subSvgUid}`;
          path.getBoundingClientRect();
          
          // Make sure we also add ID on the parent element if it exists
          if (path.parentElement) {
            path.parentElement.setAttribute('data-drawing-container', drawingId);
            path.parentElement.setAttribute('data-container-uid', subLayerUid);
            path.parentElement.setAttribute('data-parent-svg-uid', subSvgUid);
            path.parentElement.id = `drawing-container-${subLayerUid}`;
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
export const hasFloorPlan = checkFloorPlan;
