
import L from 'leaflet';

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
