
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
      
      // Use proper Leaflet event stopping - only with originalEvent which is a DOM Event
      if (e.originalEvent) {
        L.DomEvent.stopPropagation(e.originalEvent);
        L.DomEvent.preventDefault(e.originalEvent);
      }
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
    
    // Find all SVG paths in the overlay pane - use more general approach
    const overlayPane = mapContainer.querySelector('.leaflet-overlay-pane');
    if (!overlayPane) {
      console.log('No overlay pane found');
      return;
    }
    
    // Find all interactive paths and set up handlers on the ones that belong to this drawing
    const allPaths = overlayPane.querySelectorAll('path.leaflet-interactive');
    let handlerCount = 0;
    
    allPaths.forEach((path, index) => {
      // Check if this path belongs to our drawing layer
      const layerStamp = (layer as any)._leaflet_id;
      const pathLayer = (path as any)._leaflet_layer;
      
      // Alternative way: check if the path is part of our layer by comparing positions or other attributes
      const pathBounds = path.getBBox ? path.getBBox() : null;
      
      // Type guard to check if layer has getBounds method
      const layerHasBounds = 'getBounds' in layer && typeof (layer as any).getBounds === 'function';
      const layerBounds = layerHasBounds ? (layer as any).getBounds() : null;
      
      let isOurPath = false;
      
      // Method 1: Check layer stamp
      if (layerStamp && pathLayer && pathLayer._leaflet_id === layerStamp) {
        isOurPath = true;
      }
      
      // Method 2: If path already has our drawing ID
      if (path.getAttribute('data-drawing-id') === drawing.id) {
        isOurPath = true;
      }
      
      // Method 3: Check if path is a child of our layer's DOM element
      if (!isOurPath && (layer as any)._path === path) {
        isOurPath = true;
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
    
    // If no paths found, try alternative approach - look for the layer's path directly
    if (handlerCount === 0 && (layer as any)._path) {
      const layerPath = (layer as any)._path;
      console.log(`Setting up handler directly on layer path for drawing ${drawing.id}`);
      
      layerPath.setAttribute('data-drawing-id', drawing.id);
      layerPath.classList.add('clickable-drawing-path');
      layerPath.classList.add(`drawing-${drawing.id}`);
      
      const handleLayerPathClick = (event: Event) => {
        console.log(`Layer path DOM click detected for drawing ${drawing.id}`);
        
        event.stopPropagation();
        event.stopImmediatePropagation();
        event.preventDefault();
        (event as any).__handledByLayer = true;
        
        if (isMounted && onRegionClick) {
          console.log(`Calling onRegionClick from layer path handler for drawing ${drawing.id}`);
          onRegionClick(drawing);
        }
      };
      
      layerPath.addEventListener('click', handleLayerPathClick, true);
      layerPath.addEventListener('click', handleLayerPathClick, false);
      (layerPath as any).__clickHandler = handleLayerPathClick;
      
      console.log(`Set up direct layer path handler for drawing ${drawing.id}`);
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
};
