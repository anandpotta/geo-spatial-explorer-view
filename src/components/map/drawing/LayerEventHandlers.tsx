
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
  
  // Set up Leaflet layer click handler with higher priority
  layer.on('click', (e: L.LeafletMouseEvent) => {
    console.log(`Layer click detected for drawing ${drawing.id} - opening upload popup`);
    
    // Stop event propagation immediately
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
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
    } else {
      console.log(`Cannot call onRegionClick: isMounted=${isMounted}, onRegionClick=${!!onRegionClick}`);
    }
  });
  
  // Set up DOM event handler for SVG paths with immediate application
  const setupPathClickHandlers = () => {
    if (!isMounted) return;
    
    // Find SVG paths with this drawing ID
    const paths = document.querySelectorAll(`path[data-drawing-id="${drawing.id}"]`);
    console.log(`Found ${paths.length} SVG paths for drawing ${drawing.id}`);
    
    paths.forEach((path, index) => {
      if (path instanceof SVGPathElement) {
        // Create a DOM event handler specifically for SVG paths
        const handleDOMPathClick = (event: Event) => {
          console.log(`SVG path click detected for drawing ${drawing.id} (path ${index}) - opening upload popup`);
          
          // Stop all propagation immediately
          event.stopPropagation();
          event.stopImmediatePropagation();
          event.preventDefault();
          
          if (isMounted && onRegionClick) {
            console.log(`Calling onRegionClick from DOM handler for drawing ${drawing.id}`);
            try {
              onRegionClick(drawing);
              console.log(`Successfully called onRegionClick from DOM handler for drawing ${drawing.id}`);
            } catch (error) {
              console.error(`Error calling onRegionClick from DOM handler for drawing ${drawing.id}:`, error);
            }
          } else {
            console.log(`Cannot call onRegionClick from DOM: isMounted=${isMounted}, onRegionClick=${!!onRegionClick}`);
          }
        };
        
        // Remove any existing handlers first
        const existingHandler = (path as any).__clickHandler;
        if (existingHandler) {
          path.removeEventListener('click', existingHandler, true);
          path.removeEventListener('click', existingHandler, false);
        }
        
        // Add new click handler with capture=true for higher priority
        path.addEventListener('click', handleDOMPathClick, true);
        
        // Also add a non-capturing handler as fallback
        path.addEventListener('click', handleDOMPathClick, false);
        
        // Ensure the path is properly set up for clicking
        path.style.pointerEvents = 'auto';
        path.style.cursor = 'pointer';
        path.style.zIndex = '1000';
        
        // Store the handler function for potential cleanup
        (path as any).__clickHandler = handleDOMPathClick;
        
        console.log(`Set up DOM click handlers for path ${index} with drawing ID ${drawing.id}`);
      }
    });
    
    // Also set up a general click listener on the map container as a fallback
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer) {
      const containerClickHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target && target.getAttribute && target.getAttribute('data-drawing-id') === drawing.id) {
          console.log(`Container click handler triggered for drawing ${drawing.id}`);
          event.stopPropagation();
          event.preventDefault();
          
          if (isMounted && onRegionClick) {
            console.log(`Calling onRegionClick from container handler for drawing ${drawing.id}`);
            onRegionClick(drawing);
          }
        }
      };
      
      // Store the handler for cleanup
      (mapContainer as any)[`__clickHandler_${drawing.id}`] = containerClickHandler;
      mapContainer.addEventListener('click', containerClickHandler, true);
    }
  };
  
  // Set up path handlers immediately and with delays
  setupPathClickHandlers();
  setTimeout(setupPathClickHandlers, 100);
  setTimeout(setupPathClickHandlers, 500);
  setTimeout(setupPathClickHandlers, 1000);
  setTimeout(setupPathClickHandlers, 2000);
};
