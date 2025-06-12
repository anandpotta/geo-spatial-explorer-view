
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
  
  // Enhanced DOM event handler setup with better path finding
  const setupPathClickHandlers = () => {
    if (!isMounted) return;
    
    console.log(`Setting up DOM path handlers for drawing ${drawing.id}`);
    
    // Get the map to find paths more reliably
    const map = (layer as any)._map;
    if (!map) {
      console.log('No map available for path setup');
      return;
    }
    
    const mapContainer = map.getContainer();
    if (!mapContainer) {
      console.log('No map container available');
      return;
    }
    
    // Find all SVG paths in the map - use broader search
    const allPaths = mapContainer.querySelectorAll('svg path');
    console.log(`Found ${allPaths.length} total SVG paths in map`);
    
    let handlerCount = 0;
    
    allPaths.forEach((path, index) => {
      // Skip paths that already have our drawing ID
      if (path.getAttribute('data-drawing-id')) {
        return;
      }
      
      // Check if this path belongs to our drawing layer
      const layerStamp = (layer as any)._leaflet_id;
      const pathLayer = (path as any)._leaflet_layer;
      
      let isOurPath = false;
      
      // Method 1: Check layer stamp
      if (layerStamp && pathLayer && pathLayer._leaflet_id === layerStamp) {
        isOurPath = true;
        console.log(`Path ${index} matched by layer stamp`);
      }
      
      // Method 2: Check if path is the layer's direct path element
      if (!isOurPath && (layer as any)._path === path) {
        isOurPath = true;
        console.log(`Path ${index} matched as layer's direct path`);
      }
      
      // Method 3: Check if path is interactive and recent (likely our new drawing)
      if (!isOurPath && path.classList.contains('leaflet-interactive')) {
        // For newly created paths without IDs, assume they belong to the most recent drawing
        const pathCreatedAt = path.getAttribute('data-created-at');
        const currentTime = Date.now();
        
        if (!pathCreatedAt || (currentTime - parseInt(pathCreatedAt)) < 5000) {
          isOurPath = true;
          console.log(`Path ${index} matched as recent interactive path`);
        }
      }
      
      if (isOurPath) {
        console.log(`Setting up DOM handler for path ${index} belonging to drawing ${drawing.id}`);
        
        // Set drawing ID and other attributes
        path.setAttribute('data-drawing-id', drawing.id);
        path.classList.add('clickable-drawing-path');
        path.classList.add(`drawing-${drawing.id}`);
        
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
        
        // Remove any existing handlers first
        const existingHandler = (path as any).__clickHandler;
        if (existingHandler) {
          path.removeEventListener('click', existingHandler, true);
          path.removeEventListener('click', existingHandler, false);
        }
        
        // Add click handlers with maximum priority (capture=true)
        path.addEventListener('click', handleDOMPathClick, true);
        path.addEventListener('click', handleDOMPathClick, false);
        
        // Ensure the path is properly set up for clicking
        const pathElement = path as HTMLElement;
        pathElement.style.pointerEvents = 'auto';
        pathElement.style.cursor = 'pointer';
        pathElement.style.zIndex = '1000';
        
        // Store the handler function for cleanup
        (path as any).__clickHandler = handleDOMPathClick;
        
        handlerCount++;
      }
    });
    
    console.log(`Set up ${handlerCount} DOM click handlers for drawing ${drawing.id}`);
    return handlerCount;
  };
  
  // Set up path handlers with multiple attempts and increasing delays
  const maxAttempts = 6;
  let attempt = 0;
  
  const trySetupHandlers = () => {
    attempt++;
    const handlersSet = setupPathClickHandlers();
    
    console.log(`Attempt ${attempt}: Set up ${handlersSet || 0} handlers for drawing ${drawing.id}`);
    
    // If we successfully set up handlers or reached max attempts, stop trying
    if (handlersSet && handlersSet > 0) {
      console.log(`Successfully set up handlers for drawing ${drawing.id} on attempt ${attempt}`);
      return;
    }
    
    if (attempt < maxAttempts) {
      const delay = attempt * 200; // Increasing delay: 200ms, 400ms, 600ms, etc.
      setTimeout(trySetupHandlers, delay);
    } else {
      console.warn(`Failed to set up DOM handlers for drawing ${drawing.id} after ${maxAttempts} attempts`);
    }
  };
  
  // Start the setup process
  trySetupHandlers();
};
