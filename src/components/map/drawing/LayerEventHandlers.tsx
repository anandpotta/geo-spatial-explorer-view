
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
  
  console.log(`Setting up click handlers for drawing ${drawing.id} with callback:`, !!onRegionClick);
  
  // Remove any existing handlers first
  layer.off('click');
  
  // Set up Leaflet layer click handler
  layer.on('click', (e: L.LeafletMouseEvent) => {
    console.log(`Layer click detected for drawing ${drawing.id} - opening upload popup`);
    
    // Stop event propagation
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      e.originalEvent.stopImmediatePropagation();
      (e.originalEvent as any).__handledByLayer = true;
      
      L.DomEvent.stopPropagation(e.originalEvent);
      L.DomEvent.preventDefault(e.originalEvent);
    }
    
    if (isMounted && onRegionClick) {
      console.log(`Calling onRegionClick for drawing ${drawing.id}`);
      try {
        onRegionClick(drawing);
        console.log(`Successfully called onRegionClick for drawing ${drawing.id}`);
      } catch (error) {
        console.error(`Error calling onRegionClick for drawing ${drawing.id}:`, error);
      }
    }
  });
  
  // Enhanced DOM event handler setup - find paths by drawing ID
  const setupDOMClickHandlers = () => {
    console.log(`Setting up DOM click handlers for drawing ${drawing.id}`);
    
    // Find all paths with this drawing ID
    const pathsWithDrawingId = document.querySelectorAll(`path[data-drawing-id="${drawing.id}"]`);
    console.log(`Found ${pathsWithDrawingId.length} paths with drawing ID ${drawing.id}`);
    
    let handlersAttached = 0;
    
    pathsWithDrawingId.forEach((path, index) => {
      const pathElement = path as HTMLElement;
      
      // Check if handler is already attached
      if (!(pathElement as any).__drawingClickHandler) {
        console.log(`Attaching DOM click handler to path ${index} for drawing ${drawing.id}`);
        
        const handleDOMPathClick = (event: Event) => {
          console.log(`DOM path click detected for drawing ${drawing.id} - opening upload popup`);
          
          // Stop all propagation
          event.stopPropagation();
          event.stopImmediatePropagation();
          event.preventDefault();
          
          // Mark as handled
          (event as any).__handledByLayer = true;
          
          if (isMounted && onRegionClick) {
            console.log(`Calling onRegionClick from DOM handler for drawing ${drawing.id}`);
            try {
              onRegionClick(drawing);
              console.log(`Successfully called onRegionClick from DOM handler for drawing ${drawing.id}`);
            } catch (error) {
              console.error(`Error calling onRegionClick from DOM handler for drawing ${drawing.id}:`, error);
            }
          }
        };
        
        // Add click handlers with both capture and bubble phases
        pathElement.addEventListener('click', handleDOMPathClick, true);
        pathElement.addEventListener('click', handleDOMPathClick, false);
        
        // Ensure the path is clickable
        pathElement.style.pointerEvents = 'auto';
        pathElement.style.cursor = 'pointer';
        pathElement.style.zIndex = '1000';
        
        // Store the handler for cleanup
        (pathElement as any).__drawingClickHandler = handleDOMPathClick;
        (pathElement as any).__drawingHandlerId = drawing.id;
        
        handlersAttached++;
      } else {
        console.log(`Path ${index} already has click handler for drawing ${drawing.id}`);
      }
    });
    
    console.log(`Attached ${handlersAttached} DOM click handlers for drawing ${drawing.id}`);
    return handlersAttached;
  };
  
  // Try to set up handlers immediately and with retries
  const attemptHandlerSetup = () => {
    const handlersSet = setupDOMClickHandlers();
    
    if (handlersSet === 0) {
      // If no handlers were set, try again after a short delay
      console.log(`No handlers attached for ${drawing.id}, retrying in 100ms`);
      setTimeout(() => {
        const retryHandlers = setupDOMClickHandlers();
        if (retryHandlers === 0) {
          // One more retry after a longer delay
          console.log(`Still no handlers for ${drawing.id}, final retry in 500ms`);
          setTimeout(() => {
            const finalHandlers = setupDOMClickHandlers();
            if (finalHandlers === 0) {
              console.warn(`Failed to attach handlers for drawing ${drawing.id} after all retries`);
            }
          }, 500);
        }
      }, 100);
    }
  };
  
  // Start the setup process
  attemptHandlerSetup();
};
