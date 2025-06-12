
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
  
  // Set up the primary Leaflet layer click handler with more specific logging
  layer.on('click', (e: L.LeafletMouseEvent) => {
    console.log(`🎯 LAYER CLICK HANDLER TRIGGERED for drawing ${drawing.id}`, e);
    
    // Stop event propagation for Leaflet events
    if (e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
      L.DomEvent.preventDefault(e.originalEvent);
      e.originalEvent.stopImmediatePropagation();
      
      // Mark the event as handled by layer
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
  });
  
  // Set up DOM-level click handlers as backup with improved path finding
  const setupDOMClickHandlers = () => {
    console.log(`Setting up DOM backup handlers for drawing ${drawing.id}`);
    
    // More comprehensive selectors to find the path element
    const selectors = [
      `path[data-drawing-id="${drawing.id}"]`,
      `#drawing-path-${drawing.id}`,
      `path[data-path-uid*="${drawing.id}"]`,
      `svg path[data-drawing-id="${drawing.id}"]`,
      `.leaflet-interactive[data-drawing-id="${drawing.id}"]`
    ];
    
    let pathElement: HTMLElement | null = null;
    
    for (const selector of selectors) {
      pathElement = document.querySelector(selector) as HTMLElement;
      if (pathElement) {
        console.log(`✅ Found path element for drawing ${drawing.id} using selector: ${selector}`, pathElement);
        break;
      }
    }
    
    // If we still haven't found it, try a broader search
    if (!pathElement) {
      const allPaths = document.querySelectorAll('path.leaflet-interactive');
      console.log(`Searching through ${allPaths.length} interactive paths for drawing ${drawing.id}`);
      
      for (const path of allPaths) {
        const drawingId = path.getAttribute('data-drawing-id');
        const pathUid = path.getAttribute('data-path-uid');
        if (drawingId === drawing.id || (pathUid && pathUid.includes(drawing.id))) {
          pathElement = path as HTMLElement;
          console.log(`✅ Found path element through broad search for drawing ${drawing.id}`, pathElement);
          break;
        }
      }
    }
    
    if (pathElement) {
      // Remove any existing handlers
      const existingHandler = (pathElement as any).__drawingClickHandler;
      if (existingHandler) {
        pathElement.removeEventListener('click', existingHandler, true);
        pathElement.removeEventListener('click', existingHandler, false);
      }
      
      const handleDOMPathClick = (event: Event) => {
        console.log(`🎯 DOM BACKUP CLICK HANDLER TRIGGERED for drawing ${drawing.id}`, event);
        
        // Stop all propagation for DOM events
        event.stopPropagation();
        event.stopImmediatePropagation();
        event.preventDefault();
        
        // Mark the event as handled by layer
        (event as any).__handledByLayer = true;
        
        if (isMounted && onRegionClick) {
          console.log(`🚀 Calling onRegionClick from DOM backup handler for drawing ${drawing.id}`);
          try {
            onRegionClick(drawing);
            console.log(`✅ Successfully called onRegionClick from DOM backup handler for drawing ${drawing.id}`);
          } catch (error) {
            console.error(`❌ Error calling onRegionClick from DOM backup handler for drawing ${drawing.id}:`, error);
          }
        }
      };
      
      // Add click handlers with both capture and bubble phases
      pathElement.addEventListener('click', handleDOMPathClick, { capture: true });
      pathElement.addEventListener('click', handleDOMPathClick, { capture: false });
      
      // Ensure the path is clickable
      pathElement.style.pointerEvents = 'auto';
      pathElement.style.cursor = 'pointer';
      
      // Store the handler for cleanup
      (pathElement as any).__drawingClickHandler = handleDOMPathClick;
      
      console.log(`✅ Successfully attached DOM backup handlers for drawing ${drawing.id}`);
      return true;
    } else {
      console.log(`❌ Path element not found for drawing ${drawing.id} with any method`);
      return false;
    }
  };
  
  // Try to set up DOM handlers immediately
  if (!setupDOMClickHandlers()) {
    // If not found immediately, try again with more aggressive delays
    const retryDelays = [50, 150, 300, 500, 1000, 2000];
    
    retryDelays.forEach((delay, index) => {
      setTimeout(() => {
        if (isMounted) {
          const success = setupDOMClickHandlers();
          if (success) {
            console.log(`✅ DOM handlers attached on retry ${index + 1} for drawing ${drawing.id}`);
          } else if (index === retryDelays.length - 1) {
            console.log(`❌ Failed to attach DOM handlers after all retries for drawing ${drawing.id}`);
          }
        }
      }, delay);
    });
  }
  
  console.log(`🔧 Completed handler setup for drawing ${drawing.id}`);
};
