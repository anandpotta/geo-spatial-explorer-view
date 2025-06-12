
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
      // Mark the event as handled by layer
      (e.originalEvent as any).__handledByLayer = true;
      
      // Use proper Leaflet event stopping
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
  
  // Enhanced DOM event handler setup
  const setupPathClickHandlers = () => {
    if (!isMounted) return 0;
    
    console.log(`Setting up DOM path handlers for drawing ${drawing.id}`);
    
    // Get the map to find paths more reliably
    const map = (layer as any)._map;
    if (!map) {
      console.log('No map available for path setup');
      return 0;
    }
    
    const mapContainer = map.getContainer();
    if (!mapContainer) {
      console.log('No map container available');
      return 0;
    }
    
    let handlerCount = 0;
    
    // Strategy 1: Find paths that already have our drawing ID but need handlers
    const existingPaths = mapContainer.querySelectorAll(`path[data-drawing-id="${drawing.id}"]`);
    console.log(`Found ${existingPaths.length} existing paths with drawing ID ${drawing.id}`);
    
    existingPaths.forEach((path, index) => {
      const pathElement = path as HTMLElement;
      
      // Check if handler is already attached
      if (!(pathElement as any).__clickHandler) {
        console.log(`Setting up handler for existing path ${index} with drawing ID ${drawing.id}`);
        
        const handleDOMPathClick = (event: Event) => {
          console.log(`SVG path DOM click detected for drawing ${drawing.id} - opening upload popup`);
          
          // Stop all propagation with maximum priority
          event.stopPropagation();
          event.stopImmediatePropagation();
          event.preventDefault();
          
          // Mark the event as handled by layer
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
        
        // Add click handlers with maximum priority (capture=true)
        pathElement.addEventListener('click', handleDOMPathClick, true);
        pathElement.addEventListener('click', handleDOMPathClick, false);
        
        // Ensure the path is properly set up for clicking
        pathElement.style.pointerEvents = 'auto';
        pathElement.style.cursor = 'pointer';
        pathElement.style.zIndex = '1000';
        
        // Store the handler function for cleanup
        (pathElement as any).__clickHandler = handleDOMPathClick;
        (pathElement as any).__drawingId = drawing.id;
        
        handlerCount++;
      } else {
        console.log(`Path ${index} already has click handler for drawing ${drawing.id}`);
      }
    });
    
    // Strategy 2: Find interactive paths without drawing ID (for newly created paths)
    if (handlerCount === 0) {
      const allPaths = mapContainer.querySelectorAll('svg path.leaflet-interactive:not([data-drawing-id])');
      console.log(`Found ${allPaths.length} interactive SVG paths without drawing ID`);
      
      const layerStamp = (layer as any)._leaflet_id;
      
      allPaths.forEach((path, index) => {
        // Check if this path belongs to our drawing layer
        let isOurPath = false;
        
        // Method 1: Check if path is the layer's direct path element
        if ((layer as any)._path === path) {
          isOurPath = true;
          console.log(`Path ${index} matched as layer's direct path`);
        }
        
        // Method 2: Check layer stamp on the path's associated layer
        const pathLayer = (path as any)._leaflet_layer;
        if (!isOurPath && layerStamp && pathLayer && pathLayer._leaflet_id === layerStamp) {
          isOurPath = true;
          console.log(`Path ${index} matched by layer stamp`);
        }
        
        // Method 3: Check if this is a recent path by color matching
        if (!isOurPath && (layer as any).options) {
          const layerColor = (layer as any).options.color;
          const pathColor = path.getAttribute('stroke') || (path as HTMLElement).style.stroke;
          
          if (layerColor && pathColor && layerColor === pathColor) {
            isOurPath = true;
            console.log(`Path ${index} matched by color: ${layerColor}`);
          }
        }
        
        if (isOurPath) {
          console.log(`Setting up DOM handler for new path ${index} belonging to drawing ${drawing.id}`);
          
          // Set drawing ID and other attributes
          path.setAttribute('data-drawing-id', drawing.id);
          path.setAttribute('id', `drawing-path-${drawing.id}`);
          path.classList.add('clickable-drawing-path');
          path.classList.add(`drawing-${drawing.id.substring(0, 8)}`);
          
          const handleDOMPathClick = (event: Event) => {
            console.log(`SVG path DOM click detected for drawing ${drawing.id} - opening upload popup`);
            
            // Stop all propagation with maximum priority
            event.stopPropagation();
            event.stopImmediatePropagation();
            event.preventDefault();
            
            // Mark the event as handled by layer
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
          
          // Add click handlers with maximum priority (capture=true)
          const pathElement = path as HTMLElement;
          pathElement.addEventListener('click', handleDOMPathClick, true);
          pathElement.addEventListener('click', handleDOMPathClick, false);
          
          // Ensure the path is properly set up for clicking
          pathElement.style.pointerEvents = 'auto';
          pathElement.style.cursor = 'pointer';
          pathElement.style.zIndex = '1000';
          
          // Store the handler function for cleanup
          (pathElement as any).__clickHandler = handleDOMPathClick;
          (pathElement as any).__drawingId = drawing.id;
          
          handlerCount++;
        }
      });
    }
    
    console.log(`Set up ${handlerCount} DOM click handlers for drawing ${drawing.id}`);
    return handlerCount;
  };
  
  // Set up path handlers with multiple attempts and increasing delays
  const maxAttempts = 5;
  let attempt = 0;
  
  const trySetupHandlers = () => {
    attempt++;
    const handlersSet = setupPathClickHandlers();
    
    console.log(`Attempt ${attempt}: Set up ${handlersSet || 0} handlers for drawing ${drawing.id}`);
    
    // If we successfully set up handlers, stop trying
    if (handlersSet && handlersSet > 0) {
      console.log(`Successfully set up handlers for drawing ${drawing.id} on attempt ${attempt}`);
      return;
    }
    
    // Continue trying if we haven't reached max attempts
    if (attempt < maxAttempts) {
      const delay = Math.min(attempt * 200, 1000); // Cap delay at 1 second
      console.log(`Retrying handler setup for drawing ${drawing.id} in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
      setTimeout(trySetupHandlers, delay);
    } else {
      console.warn(`Failed to set up DOM handlers for drawing ${drawing.id} after ${maxAttempts} attempts`);
    }
  };
  
  // Start the setup process immediately and with a small delay
  setupPathClickHandlers();
  setTimeout(trySetupHandlers, 100);
};
