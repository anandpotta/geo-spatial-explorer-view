
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
 * Sets up a robust observer for newly created drawing paths
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
          console.log('🔍 Observer: New SVG path detected:', node);
          
          // Check if this is a drawing path that needs processing
          const hasDrawingId = node.getAttribute('data-drawing-id');
          const isInteractive = node.classList.contains('leaflet-interactive');
          
          if (isInteractive && !hasDrawingId) {
            console.log('🎯 Observer: Found unprocessed interactive path');
            
            // Check if we have a current drawing context
            const currentDrawingId = (window as any).lastCreatedDrawingId;
            if (currentDrawingId) {
              console.log(`🔧 Observer: Applying drawing ID ${currentDrawingId} to new path`);
              applyAttributesToPath(node, currentDrawingId);
              
              // Set up click handler immediately
              setupPathClickHandler(node, currentDrawingId);
            } else {
              // Mark for later processing
              node.setAttribute('data-needs-processing', 'true');
              node.setAttribute('data-created-timestamp', Date.now().toString());
            }
          }
        }
        
        // Also check for SVG elements being added
        if (node instanceof SVGElement || node instanceof Element) {
          const paths = node.querySelectorAll('path.leaflet-interactive:not([data-drawing-id])');
          paths.forEach((path) => {
            if (path instanceof SVGPathElement) {
              console.log('🔍 Observer: Found nested unprocessed path');
              const currentDrawingId = (window as any).lastCreatedDrawingId;
              if (currentDrawingId) {
                applyAttributesToPath(path, currentDrawingId);
                setupPathClickHandler(path, currentDrawingId);
              }
            }
          });
        }
      });
    });
  });
  
  observer.observe(leafletContainer, {
    childList: true,
    subtree: true
  });
  
  console.log('🎧 Observer: Drawing path observer set up');
  
  return () => {
    if (observer) {
      observer.disconnect();
      observer = null;
      console.log('🔇 Observer: Drawing path observer disconnected');
    }
  };
};

/**
 * Sets up click handler for a specific path element
 */
const setupPathClickHandler = (pathElement: SVGPathElement, drawingId: string) => {
  const clickHandler = (event: Event) => {
    console.log(`🖱️ Path click detected for drawing ${drawingId}`);
    event.stopPropagation();
    event.preventDefault();
    
    // Get the drawing handler from global storage
    const handlers = (window as any).drawingClickHandlers;
    console.log(`🔍 Looking for handler for ${drawingId} in handlers:`, handlers ? Array.from(handlers.keys()) : 'No handlers');
    
    if (handlers && handlers.has && handlers.has(drawingId)) {
      const { drawing, onRegionClick } = handlers.get(drawingId);
      console.log(`📞 Calling onRegionClick for ${drawingId}`);
      onRegionClick(drawing);
    } else {
      console.warn(`❌ No handler found for drawing ${drawingId}`);
      console.log(`🔍 Available handler keys:`, handlers ? Array.from(handlers.keys()) : 'No handlers map');
    }
  };
  
  pathElement.addEventListener('click', clickHandler);
  console.log(`✅ Click handler set up for path ${drawingId}`);
};

/**
 * Processes paths that were marked as needing processing
 */
export const processMarkedPaths = (drawingId: string): void => {
  console.log(`🔧 Processing marked paths for drawing ID: ${drawingId}`);
  
  const markedPaths = document.querySelectorAll('path[data-needs-processing="true"]');
  console.log(`Found ${markedPaths.length} paths marked for processing`);
  
  markedPaths.forEach((path) => {
    if (path instanceof SVGPathElement) {
      const timestamp = path.getAttribute('data-created-timestamp');
      const age = timestamp ? Date.now() - parseInt(timestamp) : 0;
      
      // Only process recent paths (within 30 seconds)
      if (age < 30000) {
        console.log(`🎯 Processing marked path for ${drawingId}`);
        path.removeAttribute('data-needs-processing');
        path.removeAttribute('data-created-timestamp');
        applyAttributesToPath(path, drawingId);
        setupPathClickHandler(path, drawingId);
      }
    }
  });
  
  // Also find and process any existing paths without drawing IDs
  const unprocessedPaths = document.querySelectorAll('path.leaflet-interactive:not([data-drawing-id])');
  console.log(`Found ${unprocessedPaths.length} unprocessed interactive paths`);
  
  unprocessedPaths.forEach((path) => {
    if (path instanceof SVGPathElement) {
      console.log(`🎯 Processing unprocessed interactive path for ${drawingId}`);
      applyAttributesToPath(path, drawingId);
      setupPathClickHandler(path, drawingId);
    }
  });
};

/**
 * Sets the current drawing context and processes any waiting paths
 */
export const setCurrentDrawingContext = (drawingId: string): void => {
  (window as any).lastCreatedDrawingId = drawingId;
  console.log(`🎯 Set current drawing context to: ${drawingId}`);
  
  // Process any paths that were waiting for a drawing ID immediately
  processMarkedPaths(drawingId);
  
  // Clear context after a reasonable time
  setTimeout(() => {
    if ((window as any).lastCreatedDrawingId === drawingId) {
      (window as any).lastCreatedDrawingId = null;
      console.log(`🧹 Cleared drawing context for: ${drawingId}`);
    }
  }, 15000); // 15 seconds to allow for complex polygon drawing
};

/**
 * Updates the drawing ID on existing path elements
 */
export const updatePathDrawingId = (oldId: string, newId: string): void => {
  console.log(`🔄 Updating path drawing ID from ${oldId} to ${newId}`);
  
  // Find paths with the old ID
  const paths = document.querySelectorAll(`path[data-drawing-id="${oldId}"]`);
  console.log(`Found ${paths.length} paths to update`);
  
  paths.forEach((path) => {
    if (path instanceof SVGPathElement) {
      // Update the drawing ID attribute
      path.setAttribute('data-drawing-id', newId);
      path.setAttribute('id', `drawing-path-${newId}`);
      
      // Update the UID
      const newUid = `uid-${newId}-${Date.now()}`;
      path.setAttribute('data-path-uid', newUid);
      
      // Update CSS classes
      const oldClass = `drawing-path-${oldId.substring(0, 8)}`;
      const newClass = `drawing-path-${newId.substring(0, 8)}`;
      path.classList.remove(oldClass);
      path.classList.add(newClass);
      
      console.log(`✅ Updated path attributes for ${newId}`);
      
      // Update click handler
      setupPathClickHandler(path, newId);
    }
  });
};

/**
 * Main function to apply drawing attributes to a layer
 */
export const addDrawingAttributesToLayer = (layer: L.Layer, drawingId: string): void => {
  if (!layer) return;

  try {
    console.log(`🎯 Adding drawing attributes for ${drawingId}`);
    
    // Set the current drawing context immediately
    setCurrentDrawingContext(drawingId);
    
    // Store drawing ID on the layer object
    (layer as any).drawingId = drawingId;
    
    // Try to find and process the path immediately
    const processLayer = () => {
      // Strategy 1: Direct access to layer's path
      if ((layer as any)._path && (layer as any)._path.tagName === 'path') {
        console.log(`✅ Found direct path for ${drawingId}`);
        applyAttributesToPath((layer as any)._path, drawingId);
        setupPathClickHandler((layer as any)._path, drawingId);
        return true;
      }
      
      // Strategy 2: Find by various selectors
      const selectors = [
        `path[id*="${drawingId}"]`,
        `path.leaflet-interactive:not([data-drawing-id])`,
        'path[data-needs-processing="true"]'
      ];
      
      for (const selector of selectors) {
        const paths = document.querySelectorAll(selector);
        for (const path of Array.from(paths)) {
          if (path instanceof SVGPathElement) {
            console.log(`✅ Found path via selector ${selector} for ${drawingId}`);
            applyAttributesToPath(path, drawingId);
            setupPathClickHandler(path, drawingId);
            return true;
          }
        }
      }
      
      return false;
    };
    
    // Try immediate processing
    if (!processLayer()) {
      // Set up delayed processing with multiple attempts
      const retryDelays = [100, 300, 600, 1000, 2000];
      retryDelays.forEach((delay) => {
        setTimeout(() => {
          if (!processLayer()) {
            console.log(`⏰ Retry ${delay}ms failed for ${drawingId}`);
          }
        }, delay);
      });
    }
    
  } catch (err) {
    console.error('Error adding drawing attributes to layer:', err);
  }
};
