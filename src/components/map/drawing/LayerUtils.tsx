
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
 * Creates a drawing layer from GeoJSON and applies options
 */
export const createGeoJSONLayer = (drawing: DrawingData, options: L.PathOptions): L.GeoJSON | null => {
  try {
    console.log(`Creating GeoJSON layer for drawing ${drawing.id}`);
    
    // Create layer with standard options
    const layer = L.geoJSON(drawing.geoJSON, options);
    
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
 * Adds drawing ID attributes to SVG paths using direct DOM manipulation
 */
export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  if (!layer) return;

  try {
    // Store drawing ID on the layer object itself
    (layer as any).drawingId = drawingId;
    
    console.log(`Adding drawing attributes for ${drawingId}`);
    
    // Function to apply attributes to a path element
    const applyAttributesToPath = (pathElement: SVGPathElement, id: string) => {
      console.log(`Applying attributes directly to path for ${id}`);
      
      pathElement.setAttribute('data-drawing-id', id);
      pathElement.setAttribute('id', `drawing-path-${id}`);
      pathElement.setAttribute('data-path-uid', `uid-${id}-${Date.now()}`);
      pathElement.classList.add('drawing-path-' + id.substring(0, 8));
      pathElement.classList.add('visible-path-stroke');
      pathElement.setAttribute('data-drawing-type', 'user-drawn');
      pathElement.setAttribute('data-clickable', 'true');
      
      console.log(`Applied attributes:`, {
        'data-drawing-id': pathElement.getAttribute('data-drawing-id'),
        'id': pathElement.getAttribute('id')
      });
    };

    // Direct path element targeting
    const processLayer = (targetLayer: any) => {
      if (targetLayer._path && targetLayer._path.tagName === 'path') {
        applyAttributesToPath(targetLayer._path, drawingId);
        return true;
      }
      return false;
    };

    // Process the main layer
    let processed = processLayer(layer);
    
    // If it's a feature group, process each sublayer
    if (!processed && typeof (layer as any).eachLayer === 'function') {
      (layer as any).eachLayer((subLayer: L.Layer) => {
        (subLayer as any).drawingId = drawingId;
        const success = processLayer(subLayer);
        if (success) processed = true;
      });
    }
    
    // Fallback: Use MutationObserver to catch paths created after this function runs
    if (!processed) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // Check if it's a path element or contains path elements
                const paths = element.tagName === 'path' ? 
                  [element] : 
                  element.querySelectorAll('path');
                
                paths.forEach((path) => {
                  // Only apply to paths that don't already have drawing IDs
                  if (!path.getAttribute('data-drawing-id')) {
                    // Check if this path belongs to our layer by proximity or class
                    const isOurPath = path.classList.contains('leaflet-interactive') ||
                                    path.classList.contains('leaflet-drawing') ||
                                    path.closest('.leaflet-overlay-pane');
                    
                    if (isOurPath) {
                      applyAttributesToPath(path as SVGPathElement, drawingId);
                    }
                  }
                });
              }
            });
          }
        });
      });
      
      // Start observing the overlay pane for new path elements
      const overlayPane = document.querySelector('.leaflet-overlay-pane');
      if (overlayPane) {
        observer.observe(overlayPane, {
          childList: true,
          subtree: true
        });
        
        // Stop observing after a short delay
        setTimeout(() => {
          observer.disconnect();
        }, 1000);
      }
    }
    
  } catch (err) {
    console.error('Error adding drawing attributes to layer:', err);
  }
};

/**
 * Checks if a drawing has a floor plan
 */
export const hasFloorPlan = checkFloorPlan;
