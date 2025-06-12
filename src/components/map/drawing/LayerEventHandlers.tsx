
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
  
  // Enhanced DOM event handler setup with multiple search strategies
  const setupDOMClickHandlers = () => {
    console.log(`Setting up DOM click handlers for drawing ${drawing.id}`);
    
    let pathElements: HTMLElement[] = [];
    
    // Strategy 1: Find by data-drawing-id
    const pathsWithDrawingId = document.querySelectorAll(`path[data-drawing-id="${drawing.id}"]`);
    pathElements = [...pathElements, ...Array.from(pathsWithDrawingId)] as HTMLElement[];
    
    // Strategy 2: Find by id attribute
    const pathWithId = document.getElementById(`drawing-path-${drawing.id}`);
    if (pathWithId && !pathElements.includes(pathWithId)) {
      pathElements.push(pathWithId);
    }
    
    // Strategy 3: Find paths with class containing drawing ID
    const pathsWithClass = document.querySelectorAll(`path.drawing-path-${drawing.id}`);
    pathsWithClass.forEach(path => {
      if (!pathElements.includes(path as HTMLElement)) {
        pathElements.push(path as HTMLElement);
      }
    });
    
    // Strategy 4: Find all drawing paths and filter by drawing ID
    const allDrawingPaths = document.querySelectorAll('path[data-drawing-id], path[id*="drawing-path"], path.leaflet-interactive');
    allDrawingPaths.forEach(path => {
      const pathElement = path as HTMLElement;
      const pathDrawingId = pathElement.getAttribute('data-drawing-id') || 
                           pathElement.id.replace('drawing-path-', '') ||
                           pathElement.className.match(/drawing-path-([^\s]+)/)?.[1];
      
      if (pathDrawingId === drawing.id && !pathElements.includes(pathElement)) {
        pathElements.push(pathElement);
      }
    });
    
    console.log(`Found ${pathElements.length} paths for drawing ${drawing.id}:`, pathElements.map(p => ({
      id: p.id,
      drawingId: p.getAttribute('data-drawing-id'),
      classes: p.className
    })));
    
    let handlersAttached = 0;
    
    pathElements.forEach((pathElement, index) => {
      // Check if handler is already attached
      if (!(pathElement as any).__drawingClickHandler) {
        console.log(`Attaching DOM click handler to path ${index} for drawing ${drawing.id}`);
        
        const handleDOMPathClick = (event: Event) => {
          console.log(`DOM path click detected for drawing ${drawing.id} - opening upload popup`);
          console.log('Event target:', event.target);
          console.log('Event currentTarget:', event.currentTarget);
          
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
        
        // Add click handlers with both capture and bubble phases for maximum coverage
        pathElement.addEventListener('click', handleDOMPathClick, true);
        pathElement.addEventListener('click', handleDOMPathClick, false);
        pathElement.addEventListener('mousedown', handleDOMPathClick, true);
        pathElement.addEventListener('mouseup', handleDOMPathClick, true);
        
        // Ensure the path is clickable and visible
        pathElement.style.pointerEvents = 'auto';
        pathElement.style.cursor = 'pointer';
        pathElement.style.zIndex = '1000';
        
        // Add visual feedback on hover
        pathElement.addEventListener('mouseover', () => {
          pathElement.style.opacity = '0.8';
        });
        pathElement.addEventListener('mouseout', () => {
          pathElement.style.opacity = '1';
        });
        
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
  
  // Immediate setup with multiple retries
  const maxRetries = 5;
  let retryCount = 0;
  
  const attemptHandlerSetup = () => {
    const handlersSet = setupDOMClickHandlers();
    
    if (handlersSet === 0 && retryCount < maxRetries) {
      retryCount++;
      console.log(`No handlers attached for ${drawing.id}, retry ${retryCount}/${maxRetries} in ${100 * retryCount}ms`);
      setTimeout(attemptHandlerSetup, 100 * retryCount);
    } else if (handlersSet === 0) {
      console.warn(`Failed to attach handlers for drawing ${drawing.id} after ${maxRetries} retries`);
    } else {
      console.log(`Successfully attached ${handlersSet} handlers for drawing ${drawing.id}`);
    }
  };
  
  // Start the setup process immediately
  attemptHandlerSetup();
  
  // Also set up handlers when DOM changes
  const observer = new MutationObserver(() => {
    if (setupDOMClickHandlers() > 0) {
      observer.disconnect();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-drawing-id', 'id', 'class']
  });
  
  // Clean up observer after 10 seconds
  setTimeout(() => {
    observer.disconnect();
  }, 10000);
};
