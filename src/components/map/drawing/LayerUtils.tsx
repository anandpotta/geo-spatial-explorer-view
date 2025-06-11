
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
    // Create a copy of options without renderer for GeoJSON
    const geoJSONOptions = { ...options };
    // Remove renderer from GeoJSON options as it's not a valid property
    if ('renderer' in geoJSONOptions) {
      delete geoJSONOptions.renderer;
    }
    
    // Create layer with corrected options
    const layer = L.geoJSON(drawing.geoJSON, geoJSONOptions);
    
    if (!layer) {
      return null;
    }
    
    // Store the drawing ID at the layer level as well for easier reference
    (layer as any).drawingId = drawing.id;
    
    // After creation, apply SVG renderer to each layer
    layer.eachLayer((l: any) => {
      if (l && l.options) {
        // Apply SVG renderer to the layer options
        l.options.renderer = L.svg();
        
        // Ensure stroke is set to true for this layer
        l.options.stroke = true;
        l.options.weight = options.weight || 4;
        l.options.opacity = 1;
        
        // Store the drawing ID on the layer
        l.drawingId = drawing.id;
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
 * Adds drawing ID attributes to SVG paths in a layer - Enhanced version with immediate DOM manipulation
 */
export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  if (!layer) return;

  try {
    // Store drawing ID on the layer object itself
    (layer as any).drawingId = drawingId;
    
    console.log(`Starting attribute addition for drawing ${drawingId}`);
    
    // Function to add attributes to a path element
    const addAttributesToPath = (path: SVGPathElement): boolean => {
      if (!path) return false;
      
      console.log(`Adding drawing ID ${drawingId} to SVG path element:`, path);
      
      // Add multiple ways to identify this path
      path.setAttribute('data-drawing-id', drawingId);
      path.setAttribute('id', `drawing-path-${drawingId}`);
      
      // Add classes for identification and styling
      path.classList.add('drawing-path-' + drawingId.substring(0, 8));
      path.classList.add('leaflet-interactive-drawing');
      path.classList.add('visible-path-stroke');
      
      // Add a unique identifier for the path
      const uid = `uid-${drawingId}-${Date.now()}`;
      path.setAttribute('data-path-uid', uid);
      
      // Store drawing metadata
      path.setAttribute('data-drawing-type', 'user-drawn');
      path.setAttribute('data-clickable', 'true');
      
      // Make sure we also add ID on the parent element if it exists
      if (path.parentElement) {
        path.parentElement.setAttribute('data-drawing-container', drawingId);
        path.parentElement.setAttribute('id', `drawing-container-${drawingId}`);
      }
      
      console.log(`Successfully added drawing attributes to path for ${drawingId}:`, {
        'data-drawing-id': path.getAttribute('data-drawing-id'),
        'data-path-uid': path.getAttribute('data-path-uid'),
        'id': path.getAttribute('id'),
        'classes': path.className
      });
      
      return true;
    };

    // Try immediate access first
    const processLayer = (targetLayer: any) => {
      if (targetLayer._path && targetLayer._path.tagName === 'path') {
        return addAttributesToPath(targetLayer._path);
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

    // If immediate processing didn't work, use MutationObserver to watch for DOM changes
    if (!processed) {
      console.log(`Immediate processing failed for ${drawingId}, setting up MutationObserver`);
      
      const observer = new MutationObserver((mutations) => {
        let found = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // Check if it's a path element
                if (element.tagName === 'path') {
                  console.log(`MutationObserver found path element for ${drawingId}`);
                  const success = addAttributesToPath(element as SVGPathElement);
                  if (success) found = true;
                }
                
                // Check child path elements
                const pathElements = element.querySelectorAll('path');
                pathElements.forEach(pathEl => {
                  console.log(`MutationObserver found child path element for ${drawingId}`);
                  const success = addAttributesToPath(pathEl as SVGPathElement);
                  if (success) found = true;
                });
              }
            });
          }
        });
        
        if (found) {
          console.log(`MutationObserver successfully processed ${drawingId}, disconnecting`);
          observer.disconnect();
        }
      });
      
      // Start observing the document for new elements
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Disconnect after 5 seconds to prevent memory leaks
      setTimeout(() => {
        observer.disconnect();
        console.log(`MutationObserver timeout for ${drawingId}`);
      }, 5000);
    }
    
    // Also set up an event listener to catch when the path is actually rendered
    if ((layer as any).on) {
      (layer as any).on('add', () => {
        console.log(`Layer 'add' event fired for drawing ${drawingId}, processing immediately`);
        setTimeout(() => {
          processLayer(layer);
          if (typeof (layer as any).eachLayer === 'function') {
            (layer as any).eachLayer((subLayer: L.Layer) => {
              processLayer(subLayer);
            });
          }
        }, 100);
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
