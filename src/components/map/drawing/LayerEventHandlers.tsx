
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
  
  console.log(`Setting up click handlers for drawing ${drawing.id}`);
  
  // Remove any existing handlers first
  layer.off('click');
  
  // Set up the primary Leaflet layer click handler
  layer.on('click', (e: L.LeafletMouseEvent) => {
    console.log(`✅ Leaflet layer click handler triggered for drawing ${drawing.id}`);
    
    // Stop event propagation for Leaflet events
    if (e.originalEvent) {
      // Use the original DOM event for stopping propagation
      L.DomEvent.stopPropagation(e.originalEvent);
      L.DomEvent.preventDefault(e.originalEvent);
      e.originalEvent.stopImmediatePropagation();
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
  
  // Also set up DOM-level click handlers as a backup
  const setupDOMClickHandlers = () => {
    console.log(`Setting up DOM backup handlers for drawing ${drawing.id}`);
    
    // Use multiple selectors to find the path element
    const selectors = [
      `path[data-drawing-id="${drawing.id}"]`,
      `#drawing-path-${drawing.id}`,
      `path[data-path-uid*="${drawing.id}"]`
    ];
    
    let pathElement: HTMLElement | null = null;
    
    for (const selector of selectors) {
      pathElement = document.querySelector(selector) as HTMLElement;
      if (pathElement) {
        console.log(`✅ Found path element for drawing ${drawing.id} using selector: ${selector}`);
        break;
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
        console.log(`🎯 DOM backup click handler triggered for drawing ${drawing.id}`);
        
        // Stop all propagation for DOM events
        event.stopPropagation();
        event.stopImmediatePropagation();
        event.preventDefault();
        
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
      console.log(`❌ Path element not found for drawing ${drawing.id} with any selector`);
      return false;
    }
  };
  
  // Try to set up DOM handlers immediately
  if (!setupDOMClickHandlers()) {
    // If not found immediately, try again with progressive delays
    const retryDelays = [100, 300, 500, 1000];
    
    retryDelays.forEach((delay, index) => {
      setTimeout(() => {
        if (isMounted && !setupDOMClickHandlers()) {
          console.log(`⏳ Retry ${index + 1} failed for drawing ${drawing.id}, will try again...`);
        }
      }, delay);
    });
  }
  
  console.log(`🔧 Completed handler setup for drawing ${drawing.id}`);
};
