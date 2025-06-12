
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { getCurrentUser } from '@/services/auth-service';

/**
 * Sets up click handlers for drawing layers
 */
export const setupLayerClickHandlers = (
  layer: L.Layer, 
  drawing: DrawingData,
  isMounted: boolean,
  onRegionClick?: (drawing: DrawingData) => void
): void => {
  if (!layer || !isMounted) {
    console.log(`Cannot set up handlers: layer=${!!layer}, isMounted=${isMounted}`);
    return;
  }
  
  if (!onRegionClick) {
    console.log(`No onRegionClick callback provided for drawing ${drawing.id}`);
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log('No current user - skipping handler setup');
    return;
  }
  
  // Only set up click handlers for drawings owned by the current user
  if (drawing.userId && drawing.userId !== currentUser.id) {
    console.log(`Drawing ${drawing.id} belongs to another user, skipping handler setup`);
    return;
  }
  
  console.log(`Setting up click handlers for drawing ${drawing.id}, layer type:`, layer.constructor.name);
  
  // Remove any existing handlers first
  layer.off('click');
  
  // Set up the primary Leaflet layer click handler with maximum priority
  layer.on('click', (e: L.LeafletMouseEvent) => {
    console.log(`🎯 LAYER CLICK HANDLER TRIGGERED for drawing ${drawing.id}`, e);
    
    // Stop ALL propagation immediately
    e.stopPropagation();
    L.DomEvent.stop(e);
    
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.stopImmediatePropagation();
      e.originalEvent.preventDefault();
      (e.originalEvent as any).__handledByLayer = true;
    }
    
    if (isMounted && onRegionClick) {
      console.log(`🚀 Calling onRegionClick for drawing ${drawing.id}`);
      try {
        onRegionClick(drawing);
        console.log(`✅ Successfully called onRegionClick for drawing ${drawing.id}`);
      } catch (error) {
        console.error(`❌ Error calling onRegionClick for drawing ${drawing.id}:`, error);
      }
    }
    
    return false;
  }, true); // Use capture phase
  
  // Set up aggressive DOM-level handlers immediately
  const setupDOMClickHandlers = () => {
    console.log(`Setting up DOM handlers for drawing ${drawing.id}`);
    
    // Find all possible path elements for this drawing
    const selectors = [
      `path[data-drawing-id="${drawing.id}"]`,
      `#drawing-path-${drawing.id}`,
      `path[data-path-uid*="${drawing.id}"]`,
      `svg path[data-drawing-id="${drawing.id}"]`,
      `.leaflet-interactive[data-drawing-id="${drawing.id}"]`,
      `path.leaflet-interactive`
    ];
    
    let pathElements: HTMLElement[] = [];
    
    // Collect all matching elements
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
      pathElements.push(...Array.from(elements));
    }
    
    // If no specific elements found, search through all interactive paths
    if (pathElements.length === 0) {
      const allPaths = document.querySelectorAll('path.leaflet-interactive') as NodeListOf<HTMLElement>;
      console.log(`Searching through ${allPaths.length} interactive paths for drawing ${drawing.id}`);
      
      for (const path of allPaths) {
        const drawingId = path.getAttribute('data-drawing-id');
        const pathUid = path.getAttribute('data-path-uid');
        if (drawingId === drawing.id || (pathUid && pathUid.includes(drawing.id))) {
          pathElements.push(path);
        }
      }
    }
    
    if (pathElements.length > 0) {
      console.log(`✅ Found ${pathElements.length} path elements for drawing ${drawing.id}`);
      
      pathElements.forEach((pathElement, index) => {
        // Remove any existing handlers
        const existingHandler = (pathElement as any).__drawingClickHandler;
        if (existingHandler) {
          pathElement.removeEventListener('click', existingHandler, true);
          pathElement.removeEventListener('click', existingHandler, false);
        }
        
        const handleDOMPathClick = (event: Event) => {
          console.log(`🎯 DOM CLICK HANDLER TRIGGERED for drawing ${drawing.id} (element ${index})`, event);
          
          // Aggressive event stopping
          event.stopPropagation();
          event.stopImmediatePropagation();
          event.preventDefault();
          (event as any).__handledByLayer = true;
          
          if (isMounted && onRegionClick) {
            console.log(`🚀 Calling onRegionClick from DOM handler for drawing ${drawing.id}`);
            try {
              onRegionClick(drawing);
              console.log(`✅ Successfully called onRegionClick from DOM handler for drawing ${drawing.id}`);
            } catch (error) {
              console.error(`❌ Error calling onRegionClick from DOM handler for drawing ${drawing.id}:`, error);
            }
          }
          
          return false;
        };
        
        // Add handlers with maximum priority (capture phase first)
        pathElement.addEventListener('click', handleDOMPathClick, { 
          capture: true, 
          passive: false,
          once: false 
        });
        
        // Ensure the element is interactive
        pathElement.style.pointerEvents = 'auto';
        pathElement.style.cursor = 'pointer';
        pathElement.style.zIndex = '1000';
        
        // Store the handler for cleanup
        (pathElement as any).__drawingClickHandler = handleDOMPathClick;
      });
      
      return true;
    } else {
      console.log(`❌ No path elements found for drawing ${drawing.id}`);
      return false;
    }
  };
  
  // Try to set up DOM handlers immediately and with retries
  let setupSuccess = setupDOMClickHandlers();
  
  if (!setupSuccess) {
    // More frequent retries with shorter delays
    const retryDelays = [5, 10, 25, 50, 100, 200, 500];
    
    retryDelays.forEach((delay, index) => {
      setTimeout(() => {
        if (isMounted && !setupSuccess) {
          setupSuccess = setupDOMClickHandlers();
          if (setupSuccess) {
            console.log(`✅ DOM handlers attached on retry ${index + 1} (${delay}ms) for drawing ${drawing.id}`);
          }
        }
      }, delay);
    });
  }
  
  // Handle FeatureGroup layers recursively
  if (layer && typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((childLayer: L.Layer) => {
      childLayer.off('click');
      childLayer.on('click', (e: L.LeafletMouseEvent) => {
        console.log(`🎯 CHILD LAYER CLICK for drawing ${drawing.id}`, e);
        
        e.stopPropagation();
        L.DomEvent.stop(e);
        
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
          e.originalEvent.stopImmediatePropagation();
          e.originalEvent.preventDefault();
          (e.originalEvent as any).__handledByLayer = true;
        }
        
        if (isMounted && onRegionClick) {
          console.log(`🚀 Calling onRegionClick from child layer for drawing ${drawing.id}`);
          onRegionClick(drawing);
        }
        
        return false;
      }, true); // Use capture phase
    });
  }
  
  console.log(`🔧 Completed handler setup for drawing ${drawing.id}`);
};
