
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
    
    // Stop event propagation immediately with maximum priority
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      e.originalEvent.stopImmediatePropagation();
      L.DomEvent.stopPropagation(e.originalEvent);
      L.DomEvent.preventDefault(e.originalEvent);
    }
    
    // Stop Leaflet event propagation
    L.DomEvent.stopPropagation(e);
    L.DomEvent.preventDefault(e);
    
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
  
  // Set up DOM event handler for SVG paths with immediate and comprehensive setup
  const setupPathClickHandlers = () => {
    if (!isMounted) return;
    
    // Find SVG paths with this drawing ID with multiple selectors
    const pathSelectors = [
      `path[data-drawing-id="${drawing.id}"]`,
      `[data-drawing-id="${drawing.id}"]`,
      `.drawing-path-${drawing.id.substring(0, 8)}`,
      `#drawing-path-${drawing.id}`
    ];
    
    let pathsFound = 0;
    
    pathSelectors.forEach(selector => {
      const paths = document.querySelectorAll(selector);
      pathsFound += paths.length;
      
      paths.forEach((path, index) => {
        if (path instanceof SVGPathElement || path instanceof SVGElement) {
          console.log(`Setting up DOM handler for path ${index} with selector: ${selector}`);
          
          // Create a high-priority DOM event handler
          const handleDOMPathClick = (event: Event) => {
            console.log(`SVG path DOM click detected for drawing ${drawing.id} - opening upload popup`);
            
            // Stop all propagation with maximum priority
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
            }
          };
          
          // Remove any existing handlers first
          const existingHandler = (path as any).__clickHandler;
          if (existingHandler) {
            path.removeEventListener('click', existingHandler, true);
            path.removeEventListener('click', existingHandler, false);
            path.removeEventListener('mousedown', existingHandler, true);
            path.removeEventListener('mousedown', existingHandler, false);
          }
          
          // Add click handlers with maximum priority (capture=true)
          path.addEventListener('click', handleDOMPathClick, true);
          path.addEventListener('mousedown', handleDOMPathClick, true);
          
          // Also add non-capturing handlers as fallback
          path.addEventListener('click', handleDOMPathClick, false);
          path.addEventListener('mousedown', handleDOMPathClick, false);
          
          // Ensure the path is properly set up for clicking - cast to Element for style access
          const pathElement = path as unknown as Element;
          if (pathElement && 'style' in pathElement) {
            (pathElement as any).style.pointerEvents = 'auto';
            (pathElement as any).style.cursor = 'pointer';
            (pathElement as any).style.zIndex = '1000';
          }
          
          // Add specific classes for targeting
          path.classList.add('clickable-drawing-path');
          path.classList.add(`drawing-${drawing.id}`);
          
          // Store the handler function for cleanup
          (path as any).__clickHandler = handleDOMPathClick;
          
          console.log(`Set up comprehensive DOM click handlers for path with drawing ID ${drawing.id}`);
        }
      });
    });
    
    console.log(`Found and set up handlers for ${pathsFound} paths for drawing ${drawing.id}`);
    
    // Set up a delegated event listener on the map container as ultimate fallback
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer) {
      const containerClickHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        
        // Check if the click is on our drawing using multiple methods
        const isOurDrawing = target && (
          target.getAttribute('data-drawing-id') === drawing.id ||
          target.classList.contains(`drawing-${drawing.id}`) ||
          target.classList.contains(`drawing-path-${drawing.id.substring(0, 8)}`) ||
          target.id === `drawing-path-${drawing.id}` ||
          target.closest(`[data-drawing-id="${drawing.id}"]`)
        );
        
        if (isOurDrawing) {
          console.log(`Container delegated click handler triggered for drawing ${drawing.id}`);
          event.stopPropagation();
          event.stopImmediatePropagation();
          event.preventDefault();
          
          if (isMounted && onRegionClick) {
            console.log(`Calling onRegionClick from delegated handler for drawing ${drawing.id}`);
            onRegionClick(drawing);
          }
        }
      };
      
      // Remove existing handler if any
      const existingContainerHandler = (mapContainer as any)[`__clickHandler_${drawing.id}`];
      if (existingContainerHandler) {
        mapContainer.removeEventListener('click', existingContainerHandler, true);
        mapContainer.removeEventListener('click', existingContainerHandler, false);
      }
      
      // Store and add new handler
      (mapContainer as any)[`__clickHandler_${drawing.id}`] = containerClickHandler;
      mapContainer.addEventListener('click', containerClickHandler, true);
      mapContainer.addEventListener('click', containerClickHandler, false);
    }
  };
  
  // Set up path handlers with multiple attempts and increasing delays
  setupPathClickHandlers();
  setTimeout(setupPathClickHandlers, 50);
  setTimeout(setupPathClickHandlers, 100);
  setTimeout(setupPathClickHandlers, 300);
  setTimeout(setupPathClickHandlers, 500);
  setTimeout(setupPathClickHandlers, 1000);
  setTimeout(setupPathClickHandlers, 2000);
  setTimeout(setupPathClickHandlers, 3000);
};
