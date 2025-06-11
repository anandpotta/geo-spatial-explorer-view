
import L from 'leaflet';

/**
 * Applies attributes to a layer's SVG path element
 */
const applyAttributesToPath = (pathElement: SVGPathElement, drawingId: string): void => {
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

/**
 * Finds and applies attributes to SVG path elements in the map
 */
const findAndApplyToMapPaths = (layer: L.Layer, drawingId: string): boolean => {
  const map = (layer as any)._map;
  if (!map || !map.getContainer) return false;
  
  const container = map.getContainer();
  if (!container) return false;
  
  // Look for recently created paths that don't have our attributes yet
  const paths = container.querySelectorAll('.leaflet-overlay-pane path:not([data-drawing-id])');
  let applied = false;
  
  paths.forEach((path: Element) => {
    if (path instanceof SVGPathElement) {
      // Check if this path belongs to our layer by checking proximity or other indicators
      applyAttributesToPath(path, drawingId);
      applied = true;
    }
  });
  
  return applied;
};

/**
 * Applies attributes to a layer using multiple strategies
 */
const applyAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  try {
    console.log(`Applying attributes to layer for drawing ${drawingId}`);
    
    // Store drawing ID on the layer object itself
    (layer as any).drawingId = drawingId;
    
    // Strategy 1: Direct access to the layer's path element
    if ((layer as any)._path && (layer as any)._path.tagName === 'path') {
      applyAttributesToPath((layer as any)._path, drawingId);
      return;
    }
    
    // Strategy 2: Look for paths in the map that don't have attributes yet
    if (findAndApplyToMapPaths(layer, drawingId)) {
      return;
    }
    
    // Strategy 3: Set up observer for path creation
    const checkForPath = () => {
      if ((layer as any)._path && (layer as any)._path.tagName === 'path') {
        applyAttributesToPath((layer as any)._path, drawingId);
        return true;
      }
      return findAndApplyToMapPaths(layer, drawingId);
    };
    
    // Check immediately and with delays
    if (!checkForPath()) {
      setTimeout(() => {
        if (!checkForPath()) {
          setTimeout(() => {
            checkForPath();
          }, 100);
        }
      }, 50);
    }
    
  } catch (err) {
    console.error('Error applying attributes to layer:', err);
  }
};

/**
 * Sets up a global observer for newly created drawing paths
 */
export const setupDrawingPathObserver = (): (() => void) => {
  let observer: MutationObserver | null = null;
  
  // Find the leaflet container
  const leafletContainer = document.querySelector('.leaflet-container');
  if (!leafletContainer) {
    console.warn('No leaflet container found for path observer');
    return () => {};
  }
  
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof SVGPathElement) {
          // Check if this is a drawing path that needs attributes
          if (node.classList.contains('leaflet-interactive') && 
              node.classList.contains('leaflet-drawing') &&
              !node.getAttribute('data-drawing-id')) {
            
            console.log('Found new drawing path without attributes:', node);
            
            // We'll need to get the drawing ID from somewhere
            // For now, we'll add a temporary marker so we can find it later
            node.setAttribute('data-needs-drawing-id', 'true');
            node.setAttribute('data-created-at', Date.now().toString());
          }
        }
      });
    });
  });
  
  observer.observe(leafletContainer, {
    childList: true,
    subtree: true
  });
  
  return () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };
};

/**
 * Applies drawing ID to paths that were marked as needing it
 */
export const applyDrawingIdToMarkedPaths = (drawingId: string): void => {
  const paths = document.querySelectorAll('path[data-needs-drawing-id="true"]');
  
  paths.forEach((path) => {
    if (path instanceof SVGPathElement) {
      path.removeAttribute('data-needs-drawing-id');
      path.removeAttribute('data-created-at');
      applyAttributesToPath(path, drawingId);
    }
  });
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
    
    // Also apply to any recently marked paths
    applyDrawingIdToMarkedPaths(drawingId);
    
    // Set up a fallback check
    setTimeout(() => {
      applyAttributesToLayer(layer, drawingId);
      applyDrawingIdToMarkedPaths(drawingId);
    }, 200);
    
  } catch (err) {
    console.error('Error adding drawing attributes to layer:', err);
  }
};
