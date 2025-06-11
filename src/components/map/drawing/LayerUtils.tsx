
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
 * Enhanced SVG renderer that applies drawing ID attributes immediately
 */
const createEnhancedSVGRenderer = () => {
  const originalSvg = L.svg;
  
  return originalSvg({
    _addPath: function(layer: any) {
      // Call the original _addPath method
      const result = L.SVG.prototype._addPath.call(this, layer);
      
      // Immediately apply drawing ID attributes if available
      if (layer._path && layer.options && layer.options.drawingId) {
        const drawingId = layer.options.drawingId;
        console.log(`Applying attributes to SVG path for drawing ${drawingId}`);
        
        // Apply attributes directly to the path element
        layer._path.setAttribute('data-drawing-id', drawingId);
        layer._path.setAttribute('id', `drawing-path-${drawingId}`);
        layer._path.setAttribute('data-path-uid', `uid-${drawingId}-${Date.now()}`);
        layer._path.classList.add('drawing-path-' + drawingId.substring(0, 8));
        layer._path.classList.add('visible-path-stroke');
        layer._path.setAttribute('data-drawing-type', 'user-drawn');
        layer._path.setAttribute('data-clickable', 'true');
        
        console.log(`Successfully applied attributes to path:`, {
          'data-drawing-id': layer._path.getAttribute('data-drawing-id'),
          'id': layer._path.getAttribute('id'),
          'classes': layer._path.className
        });
      }
      
      return result;
    }
  });
};

/**
 * Creates a drawing layer from GeoJSON and applies options
 */
export const createGeoJSONLayer = (drawing: DrawingData, options: L.PathOptions): L.GeoJSON | null => {
  try {
    console.log(`Creating GeoJSON layer for drawing ${drawing.id}`);
    
    // Create enhanced renderer with drawing ID support
    const enhancedRenderer = createEnhancedSVGRenderer();
    
    // Create a copy of options and set the enhanced renderer
    const geoJSONOptions = { 
      ...options,
      renderer: enhancedRenderer
    };
    
    // Create layer with enhanced options
    const layer = L.geoJSON(drawing.geoJSON, geoJSONOptions);
    
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
 * Adds drawing ID attributes to SVG paths - Direct DOM approach
 */
export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  if (!layer) return;

  try {
    // Store drawing ID on the layer object itself
    (layer as any).drawingId = drawingId;
    
    console.log(`Adding drawing attributes for ${drawingId}`);
    
    // Direct path element targeting
    const applyAttributesDirectly = (targetLayer: any) => {
      if (targetLayer._path && targetLayer._path.tagName === 'path') {
        console.log(`Applying attributes directly to path for ${drawingId}`);
        
        targetLayer._path.setAttribute('data-drawing-id', drawingId);
        targetLayer._path.setAttribute('id', `drawing-path-${drawingId}`);
        targetLayer._path.setAttribute('data-path-uid', `uid-${drawingId}-${Date.now()}`);
        targetLayer._path.classList.add('drawing-path-' + drawingId.substring(0, 8));
        targetLayer._path.classList.add('visible-path-stroke');
        targetLayer._path.setAttribute('data-drawing-type', 'user-drawn');
        targetLayer._path.setAttribute('data-clickable', 'true');
        
        console.log(`Applied attributes:`, {
          'data-drawing-id': targetLayer._path.getAttribute('data-drawing-id'),
          'id': targetLayer._path.getAttribute('id')
        });
        
        return true;
      }
      return false;
    };

    // Process the main layer
    let processed = applyAttributesDirectly(layer);
    
    // If it's a feature group, process each sublayer
    if (!processed && typeof (layer as any).eachLayer === 'function') {
      (layer as any).eachLayer((subLayer: L.Layer) => {
        (subLayer as any).drawingId = drawingId;
        const success = applyAttributesDirectly(subLayer);
        if (success) processed = true;
      });
    }
    
    // Force immediate DOM application if renderer approach didn't work
    if (!processed) {
      setTimeout(() => {
        // Find all SVG paths without drawing IDs in the overlay pane
        const overlayPanes = document.querySelectorAll('.leaflet-overlay-pane');
        overlayPanes.forEach(pane => {
          const paths = pane.querySelectorAll('path:not([data-drawing-id])');
          console.log(`Found ${paths.length} paths without drawing IDs in overlay pane`);
          
          paths.forEach((path) => {
            // Check if this path is likely our drawing based on attributes
            const isInteractive = path.classList.contains('leaflet-interactive');
            const hasDrawingClass = path.classList.contains('leaflet-drawing');
            
            if (isInteractive || hasDrawingClass) {
              console.log(`Applying fallback attributes to path for ${drawingId}`);
              
              path.setAttribute('data-drawing-id', drawingId);
              path.setAttribute('id', `drawing-path-${drawingId}`);
              path.setAttribute('data-path-uid', `uid-${drawingId}-${Date.now()}`);
              path.classList.add('drawing-path-' + drawingId.substring(0, 8));
              path.classList.add('visible-path-stroke');
              path.setAttribute('data-drawing-type', 'user-drawn');
              path.setAttribute('data-clickable', 'true');
              
              console.log(`Fallback attributes applied:`, {
                'data-drawing-id': path.getAttribute('data-drawing-id'),
                'id': path.getAttribute('id')
              });
            }
          });
        });
      }, 50);
    }
    
  } catch (err) {
    console.error('Error adding drawing attributes to layer:', err);
  }
};

/**
 * Checks if a drawing has a floor plan
 */
export const hasFloorPlan = checkFloorPlan;
