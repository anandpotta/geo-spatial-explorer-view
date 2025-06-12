
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
  
  // Make sure the path is clickable with high priority
  pathElement.style.pointerEvents = 'auto';
  pathElement.style.cursor = 'pointer';
  pathElement.style.zIndex = '1000';
  
  // Add a class to help with CSS targeting
  pathElement.classList.add('interactive-drawing-path');
  
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
              !node.getAttribute('data-drawing-id')) {
            
            console.log('Found new drawing path without attributes:', node);
            
            // Mark it and store creation time for later identification
            node.setAttribute('data-needs-drawing-id', 'true');
            node.setAttribute('data-created-at', Date.now().toString());
            
            // Try to apply attributes immediately if we have a recent drawing context
            const recentDrawingId = (window as any).lastCreatedDrawingId;
            if (recentDrawingId) {
              console.log(`Applying immediate attributes with drawing ID: ${recentDrawingId}`);
              node.removeAttribute('data-needs-drawing-id');
              node.removeAttribute('data-created-at');
              applyAttributesToPath(node, recentDrawingId);
            }
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
  console.log(`Looking for marked paths to apply drawing ID: ${drawingId}`);
  
  const paths = document.querySelectorAll('path[data-needs-drawing-id="true"]');
  console.log(`Found ${paths.length} paths marked as needing drawing ID`);
  
  paths.forEach((path) => {
    if (path instanceof SVGPathElement) {
      console.log(`Applying drawing ID ${drawingId} to marked path`);
      path.removeAttribute('data-needs-drawing-id');
      path.removeAttribute('data-created-at');
      applyAttributesToPath(path, drawingId);
    }
  });
  
  // Also check for any recent paths without our attributes
  const allPaths = document.querySelectorAll('.leaflet-overlay-pane path:not([data-drawing-id])');
  console.log(`Found ${allPaths.length} additional paths without drawing ID`);
  
  allPaths.forEach((path) => {
    if (path instanceof SVGPathElement && 
        path.classList.contains('leaflet-interactive')) {
      console.log(`Applying drawing ID ${drawingId} to unmarked interactive path`);
      applyAttributesToPath(path, drawingId);
    }
  });
};

/**
 * Sets the current drawing context for immediate application
 */
export const setCurrentDrawingContext = (drawingId: string): void => {
  (window as any).lastCreatedDrawingId = drawingId;
  console.log(`Set current drawing context to: ${drawingId}`);
  
  // Extend the context duration to allow for polygon completion
  setTimeout(() => {
    if ((window as any).lastCreatedDrawingId === drawingId) {
      (window as any).lastCreatedDrawingId = null;
      console.log(`Cleared drawing context for: ${drawingId}`);
    }
  }, 10000); // Increased from 2000 to 10000 milliseconds to allow polygon completion
};

/**
 * Adds drawing ID attributes to SVG paths using multiple strategies
 */
export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  if (!layer) return;

  try {
    console.log(`Adding drawing attributes for ${drawingId}`);
    
    // Set the current drawing context for immediate application
    setCurrentDrawingContext(drawingId);
    
    // Store drawing ID on the layer object itself
    (layer as any).drawingId = drawingId;
    
    // Apply attributes immediately
    applyAttributesToLayer(layer, drawingId);
    
    // Also apply to any recently marked paths
    applyDrawingIdToMarkedPaths(drawingId);
    
    // Set up multiple fallback checks with increasing delays
    const applyWithDelay = (delay: number) => {
      setTimeout(() => {
        applyAttributesToLayer(layer, drawingId);
        applyDrawingIdToMarkedPaths(drawingId);
      }, delay);
    };
    
    applyWithDelay(200);
    applyWithDelay(500);
    applyWithDelay(1000);
    applyWithDelay(2000);
    
  } catch (err) {
    console.error('Error adding drawing attributes to layer:', err);
  }
};
