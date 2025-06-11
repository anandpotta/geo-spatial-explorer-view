
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
        
        // Hook into the path creation process
        if (layer && typeof (layer as any).on === 'function') {
          (layer as any).on('add', () => {
            // Apply attributes when the layer is added to the map
            setTimeout(() => {
              applyAttributesToPath(layer, drawing.id);
            }, 0);
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
 * Applies attributes to a specific path element for a layer
 */
const applyAttributesToPath = (layer: L.Layer, drawingId: string): void => {
  try {
    // Store drawing ID on the layer object itself
    (layer as any).drawingId = drawingId;
    
    console.log(`Applying attributes to path for drawing ${drawingId}`);
    
    // Function to apply attributes to a path element
    const setPathAttributes = (pathElement: SVGPathElement) => {
      console.log(`Setting attributes on path element for ${drawingId}`);
      
      pathElement.setAttribute('data-drawing-id', drawingId);
      pathElement.setAttribute('id', `drawing-path-${drawingId}`);
      pathElement.setAttribute('data-path-uid', `uid-${drawingId}-${Date.now()}`);
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

    // Direct access to the layer's path element
    if ((layer as any)._path && (layer as any)._path.tagName === 'path') {
      setPathAttributes((layer as any)._path);
      return;
    }
    
    // For layers that might not have _path directly, look for it in the DOM
    const map = (layer as any)._map;
    if (map) {
      const container = map.getContainer();
      if (container) {
        // Find recently added paths that don't have drawing IDs yet
        const recentPaths = container.querySelectorAll('.leaflet-overlay-pane path:not([data-drawing-id])');
        
        // Apply to the most recently added path(s)
        recentPaths.forEach((path: SVGPathElement) => {
          setPathAttributes(path);
        });
      }
    }
    
  } catch (err) {
    console.error('Error applying attributes to path:', err);
  }
};

/**
 * Adds drawing ID attributes to SVG paths using multiple strategies
 */
export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  if (!layer) return;

  try {
    // Store drawing ID on the layer object itself
    (layer as any).drawingId = drawingId;
    
    console.log(`Adding drawing attributes for ${drawingId}`);
    
    // Strategy 1: Direct path element targeting
    const processLayer = (targetLayer: any) => {
      if (targetLayer._path && targetLayer._path.tagName === 'path') {
        applyAttributesToPath(targetLayer, drawingId);
        return true;
      }
      return false;
    };

    // Process the main layer
    let processed = processLayer(layer);
    
    // Strategy 2: If it's a feature group, process each sublayer
    if (!processed && typeof (layer as any).eachLayer === 'function') {
      (layer as any).eachLayer((subLayer: L.Layer) => {
        (subLayer as any).drawingId = drawingId;
        const success = processLayer(subLayer);
        if (success) processed = true;
      });
    }
    
    // Strategy 3: Use a more targeted DOM approach
    if (!processed) {
      setTimeout(() => {
        const map = (layer as any)._map;
        if (map) {
          const container = map.getContainer();
          if (container) {
            // Look for paths that were just added and don't have drawing IDs
            const untaggedPaths = container.querySelectorAll('.leaflet-overlay-pane path:not([data-drawing-id])');
            
            untaggedPaths.forEach((path: SVGPathElement) => {
              // Apply attributes to untagged paths
              console.log(`Applying attributes to untagged path for ${drawingId}`);
              
              path.setAttribute('data-drawing-id', drawingId);
              path.setAttribute('id', `drawing-path-${drawingId}`);
              path.setAttribute('data-path-uid', `uid-${drawingId}-${Date.now()}`);
              path.classList.add('drawing-path-' + drawingId.substring(0, 8));
              path.classList.add('visible-path-stroke');
              path.setAttribute('data-drawing-type', 'user-drawn');
              path.setAttribute('data-clickable', 'true');
              
              console.log(`Applied attributes to path:`, {
                'data-drawing-id': path.getAttribute('data-drawing-id'),
                'id': path.getAttribute('id'),
                'data-path-uid': path.getAttribute('data-path-uid')
              });
            });
          }
        }
      }, 100);
    }
    
  } catch (err) {
    console.error('Error adding drawing attributes to layer:', err);
  }
};

/**
 * Checks if a drawing has a floor plan
 */
export const hasFloorPlan = checkFloorPlan;
