
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
 * Adds drawing ID attributes to SVG paths - Enhanced with direct DOM targeting
 */
export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  if (!layer) return;

  try {
    // Store drawing ID on the layer object itself
    (layer as any).drawingId = drawingId;
    
    console.log(`Starting enhanced attribute addition for drawing ${drawingId}`);
    
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
      
      console.log(`Successfully added drawing attributes to path for ${drawingId}:`, {
        'data-drawing-id': path.getAttribute('data-drawing-id'),
        'data-path-uid': path.getAttribute('data-path-uid'),
        'id': path.getAttribute('id'),
        'classes': path.className
      });
      
      return true;
    };

    // Enhanced DOM polling function that searches the entire document
    const pollForSvgPaths = (attempt = 1, maxAttempts = 20) => {
      if (attempt > maxAttempts) {
        console.log(`Max attempts reached for drawing ${drawingId}`);
        return;
      }
      
      console.log(`DOM polling attempt ${attempt} for drawing ${drawingId}`);
      
      // Search for SVG paths in the entire document
      const allPaths = document.querySelectorAll('path');
      let foundAndProcessed = false;
      
      allPaths.forEach((path) => {
        // Skip paths that already have a drawing ID
        if (path.getAttribute('data-drawing-id')) return;
        
        // Check if this path belongs to our drawing by examining its structure
        const pathData = path.getAttribute('d');
        const isInteractive = path.classList.contains('leaflet-interactive');
        const isInOverlayPane = path.closest('.leaflet-overlay-pane');
        
        if (pathData && isInteractive && isInOverlayPane) {
          console.log(`Found potential path for drawing ${drawingId}:`, {
            pathData,
            hasDrawingId: !!path.getAttribute('data-drawing-id'),
            classes: path.className
          });
          
          // Apply attributes to this path
          const success = addAttributesToPath(path as SVGPathElement);
          if (success) {
            foundAndProcessed = true;
            console.log(`Successfully processed path for drawing ${drawingId} on attempt ${attempt}`);
          }
        }
      });
      
      // If we didn't find and process any paths, try again with a delay
      if (!foundAndProcessed) {
        setTimeout(() => {
          pollForSvgPaths(attempt + 1, maxAttempts);
        }, 100 * attempt); // Increasing delay
      }
    };
    
    // Start polling immediately
    pollForSvgPaths();
    
    // Also try the traditional approach
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
    
  } catch (err) {
    console.error('Error adding drawing attributes to layer:', err);
  }
};

/**
 * Checks if a drawing has a floor plan
 */
export const hasFloorPlan = checkFloorPlan;
