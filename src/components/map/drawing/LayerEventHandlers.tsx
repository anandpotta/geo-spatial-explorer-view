
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
  
  // Set up Leaflet layer click handler
  layer.on('click', (e: L.LeafletMouseEvent) => {
    console.log(`Layer click detected for drawing ${drawing.id} - opening upload popup`);
    
    // Stop event propagation
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      e.originalEvent.stopImmediatePropagation();
      (e.originalEvent as any).__handledByLayer = true;
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
  
  // Also set up DOM-level click handlers as backup
  const setupDOMClickHandlers = () => {
    console.log(`Setting up DOM click handlers for drawing ${drawing.id}`);
    
    // Find the path element by data-drawing-id
    const pathElement = document.querySelector(`path[data-drawing-id="${drawing.id}"]`) as HTMLElement;
    
    if (pathElement) {
      console.log(`Found path element for drawing ${drawing.id}:`, pathElement);
      
      // Remove any existing handlers
      const existingHandler = (pathElement as any).__drawingClickHandler;
      if (existingHandler) {
        pathElement.removeEventListener('click', existingHandler, true);
        pathElement.removeEventListener('click', existingHandler, false);
      }
      
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
      
      // Add click handlers
      pathElement.addEventListener('click', handleDOMPathClick, true);
      pathElement.addEventListener('click', handleDOMPathClick, false);
      
      // Ensure the path is clickable
      pathElement.style.pointerEvents = 'auto';
      pathElement.style.cursor = 'pointer';
      
      // Store the handler for cleanup
      (pathElement as any).__drawingClickHandler = handleDOMPathClick;
      
      console.log(`Successfully attached DOM click handler for drawing ${drawing.id}`);
      return true;
    } else {
      console.log(`Path element not found for drawing ${drawing.id}`);
      return false;
    }
  };
  
  // Try to set up DOM handlers immediately
  if (!setupDOMClickHandlers()) {
    // If not found immediately, try again after a short delay
    setTimeout(() => {
      if (isMounted) {
        setupDOMClickHandlers();
      }
    }, 100);
  }
};
