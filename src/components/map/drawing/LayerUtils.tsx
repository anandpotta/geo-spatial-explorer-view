
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
            applyAttributesToLayer(layer, drawing.id);
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

/**
 * Applies attributes to a layer's SVG path element
 */
const applyAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  try {
    console.log(`Applying attributes to layer for drawing ${drawingId}`);
    
    // Store drawing ID on the layer object itself
    (layer as any).drawingId = drawingId;
    
    // Function to apply attributes to a path element
    const applyToPath = (pathElement: SVGPathElement) => {
      console.log(`Setting attributes on path element for ${drawingId}`);
      
      const uid = `uid-${drawingId}-${Date.now()}`;
      
      pathElement.setAttribute('data-drawing-id', drawingId);
      pathElement.setAttribute('id', `drawing-path-${drawingId}`);
      pathElement.setAttribute('data-path-uid', uid);
      pathElement.classList.add('drawing-path-' + drawingId.substring(0, 8));
      pathElement.classList.add('visible-path-stroke');
      pathElement.setAttribute('data-drawing-type', 'user-drawn');
      pathElement.setAttribute('data-clickable', 'true');
      
      console.log(`Successfully applied attributes to path:`, {
        'data-drawing-id': pathElement.getAttribute('data-drawing-id'),
        'id': pathElement.getAttribute('id'),
        'data-path-uid': pathElement.getAttribute('data-path-uid')
      });
    };

    // Strategy 1: Direct access to the layer's path element
    if ((layer as any)._path && (layer as any)._path.tagName === 'path') {
      applyToPath((layer as any)._path);
      return;
    }
    
    // Strategy 2: Use a more immediate approach with proper timing
    const checkForPath = () => {
      if ((layer as any)._path && (layer as any)._path.tagName === 'path') {
        applyToPath((layer as any)._path);
        return true;
      }
      return false;
    };
    
    // Check immediately
    if (!checkForPath()) {
      // If not found immediately, check a few more times with short delays
      setTimeout(() => {
        if (!checkForPath()) {
          setTimeout(() => {
            checkForPath();
          }, 50);
        }
      }, 10);
    }
    
  } catch (err) {
    console.error('Error applying attributes to layer:', err);
  }
};

/**
 * Adds drawing ID attributes to SVG paths using multiple strategies
 */
export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  if (!layer) return;

  try {
    console.log(`Adding drawing attributes for ${drawingId}`);
    
    // Store drawing ID on the layer object itself
    (layer as any).drawingId = drawingId;
    
    // Apply attributes immediately
    applyAttributesToLayer(layer, drawingId);
    
    // Also set up a fallback check
    setTimeout(() => {
      applyAttributesToLayer(layer, drawingId);
    }, 100);
    
  } catch (err) {
    console.error('Error adding drawing attributes to layer:', err);
  }
};

/**
 * Checks if a drawing has a floor plan
 */
export const hasFloorPlan = checkFloorPlan;
