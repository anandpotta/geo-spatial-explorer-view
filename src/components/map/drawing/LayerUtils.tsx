
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
    
    // After creation, apply SVG renderer to each layer and set up path monitoring
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
        
        // Override the _updatePath method to apply attributes when path is created/updated
        const originalUpdatePath = l._updatePath;
        if (originalUpdatePath) {
          l._updatePath = function() {
            // Call the original method first
            originalUpdatePath.call(this);
            
            // Apply attributes immediately after path update
            if (this._path) {
              applyAttributesToPath(this._path, drawing.id);
            }
          };
        }
        
        // Also override _initPath to catch initial path creation
        const originalInitPath = l._initPath;
        if (originalInitPath) {
          l._initPath = function() {
            // Call the original method first
            originalInitPath.call(this);
            
            // Apply attributes immediately after path initialization
            if (this._path) {
              applyAttributesToPath(this._path, drawing.id);
            }
          };
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
 * Apply attributes directly to a path element
 */
const applyAttributesToPath = (path: SVGPathElement, drawingId: string): void => {
  if (!path) return;
  
  console.log(`Applying attributes to path for drawing ${drawingId}:`, path);
  
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
  
  console.log(`Successfully applied attributes to path:`, {
    'data-drawing-id': path.getAttribute('data-drawing-id'),
    'data-path-uid': path.getAttribute('data-path-uid'),
    'id': path.getAttribute('id'),
    'classes': path.className
  });
};

/**
 * Adds drawing ID attributes to SVG paths - Enhanced with direct DOM targeting
 */
export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  if (!layer) return;

  try {
    // Store drawing ID on the layer object itself
    (layer as any).drawingId = drawingId;
    
    console.log(`Adding drawing attributes for ${drawingId}`);
    
    // Process the main layer
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
    
    // If we still haven't processed any paths, use a targeted DOM search as fallback
    if (!processed) {
      setTimeout(() => {
        // Find SVG paths that don't have drawing IDs yet
        const allPaths = document.querySelectorAll('svg path:not([data-drawing-id])');
        console.log(`Fallback: Found ${allPaths.length} paths without drawing IDs`);
        
        allPaths.forEach((path) => {
          // Check if this path is likely our drawing
          const isInteractive = path.classList.contains('leaflet-interactive');
          const isInOverlayPane = path.closest('.leaflet-overlay-pane');
          
          if (isInteractive && isInOverlayPane) {
            console.log(`Applying fallback attributes to path for ${drawingId}`);
            applyAttributesToPath(path as SVGPathElement, drawingId);
          }
        });
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
