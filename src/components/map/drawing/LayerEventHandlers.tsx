
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
  if (!layer || !isMounted || !onRegionClick) {
    console.log('Layer click handler setup skipped:', { layer: !!layer, isMounted, onRegionClick: !!onRegionClick });
    return;
  }
  
  const currentUser = getCurrentUser();
  
  // Allow anonymous users to interact with drawings, but only allow interaction with their own drawings
  // For anonymous users, we'll use 'anonymous' as the userId
  const effectiveUserId = currentUser?.id || 'anonymous';
  
  // Only set up click handlers for drawings owned by the current user (including anonymous)
  if (drawing.userId && drawing.userId !== effectiveUserId) {
    console.log(`Drawing ${drawing.id} belongs to another user, skipping handler setup`);
    return;
  }
  
  console.log(`=== SETTING UP CLICK HANDLER for drawing: ${drawing.id}, user: ${effectiveUserId} ===`);
  
  // Enhanced click handler with better event management
  const handleLayerClick = (e: L.LeafletMouseEvent) => {
    console.log(`=== LAYER CLICK HANDLER TRIGGERED ===`);
    console.log(`Drawing layer clicked: ${drawing.id}`);
    console.log('Event details:', { type: e.type, target: e.target });
    
    // Stop event propagation to prevent map click
    if (e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
      e.originalEvent.preventDefault();
      e.originalEvent.stopImmediatePropagation();
    }
    
    // Stop the leaflet event too
    L.DomEvent.stop(e);
    
    if (isMounted && onRegionClick) {
      console.log(`=== CALLING onRegionClick for drawing: ${drawing.id} ===`);
      console.log('Drawing data being passed:', drawing);
      try {
        onRegionClick(drawing);
        console.log(`=== onRegionClick called successfully for drawing: ${drawing.id} ===`);
      } catch (error) {
        console.error(`Error calling onRegionClick for drawing ${drawing.id}:`, error);
      }
    } else {
      console.warn(`Cannot call onRegionClick - isMounted: ${isMounted}, onRegionClick: ${!!onRegionClick}`);
    }
  };
  
  // Create a global function to trigger drawing clicks from DOM events
  const globalHandlerName = `triggerDrawingClick_${drawing.id}`;
  
  // Store the handler globally so DOM events can access it
  (window as any)[globalHandlerName] = () => {
    console.log(`=== GLOBAL DRAWING CLICK TRIGGERED for drawing: ${drawing.id} ===`);
    if (isMounted && onRegionClick) {
      try {
        onRegionClick(drawing);
        console.log(`=== onRegionClick called successfully from global handler for drawing: ${drawing.id} ===`);
      } catch (error) {
        console.error(`Error calling onRegionClick from global handler for drawing ${drawing.id}:`, error);
      }
    } else {
      console.warn(`Cannot call onRegionClick from global handler - isMounted: ${isMounted}, onRegionClick: ${!!onRegionClick}`);
    }
  };
  
  console.log(`=== GLOBAL HANDLER CREATED: ${globalHandlerName} ===`);
  
  // Set up the click handler on the layer with high priority
  layer.off('click'); // Remove any existing handlers first
  layer.on('click', handleLayerClick);
  console.log(`Main layer click handler attached for drawing: ${drawing.id}`);
  
  // Also set up handlers for sub-layers if this is a feature group
  if (typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((subLayer: L.Layer) => {
      console.log(`Setting up click handler for sublayer of drawing: ${drawing.id}`);
      
      // Remove any existing handlers
      subLayer.off('click');
      subLayer.on('click', handleLayerClick);
    });
  }
  
  // Simplified and more reliable SVG path setup
  const setupSvgPathAttributes = () => {
    console.log(`=== SETTING UP SVG PATH ATTRIBUTES for drawing: ${drawing.id} ===`);
    
    // Get the layer's DOM element
    let pathElement: Element | null = null;
    
    // Check if the layer has a direct path element
    if ((layer as any)._path) {
      pathElement = (layer as any)._path;
      console.log(`Found path element via layer._path for drawing: ${drawing.id}`);
    }
    
    // If no direct path, try to find it through the container
    if (!pathElement && (layer as any)._container) {
      const container = (layer as any)._container;
      pathElement = container.querySelector('path');
      if (pathElement) {
        console.log(`Found path element via container query for drawing: ${drawing.id}`);
      }
    }
    
    // If still no path, search through sub-layers
    if (!pathElement && typeof (layer as any).eachLayer === 'function') {
      (layer as any).eachLayer((subLayer: L.Layer) => {
        if (!pathElement) {
          if ((subLayer as any)._path) {
            pathElement = (subLayer as any)._path;
            console.log(`Found path element via sublayer._path for drawing: ${drawing.id}`);
          } else if ((subLayer as any)._container) {
            const subContainer = (subLayer as any)._container;
            const foundPath = subContainer.querySelector('path');
            if (foundPath) {
              pathElement = foundPath;
              console.log(`Found path element via sublayer container for drawing: ${drawing.id}`);
            }
          }
        }
      });
    }
    
    // If we found a path element, set up the attributes
    if (pathElement) {
      console.log(`=== SETTING ATTRIBUTES ON PATH ELEMENT for drawing: ${drawing.id} ===`);
      
      // Set the required attributes
      pathElement.setAttribute('data-drawing-id', drawing.id);
      pathElement.setAttribute('data-interactive', 'true');
      pathElement.setAttribute('data-global-handler', globalHandlerName);
      
      // Create DOM click handler
      const domClickHandler = (domEvent: Event) => {
        console.log(`=== DOM CLICK on SVG path for drawing: ${drawing.id} ===`);
        domEvent.stopPropagation();
        domEvent.preventDefault();
        domEvent.stopImmediatePropagation();
        
        // Call the global handler
        if ((window as any)[globalHandlerName]) {
          (window as any)[globalHandlerName]();
        }
      };
      
      // Remove any existing click handlers
      if ((pathElement as any)._drawingClickHandler) {
        pathElement.removeEventListener('click', (pathElement as any)._drawingClickHandler, true);
        pathElement.removeEventListener('click', (pathElement as any)._drawingClickHandler, false);
      }
      
      // Add the new click handler
      pathElement.addEventListener('click', domClickHandler, { capture: true, passive: false });
      pathElement.addEventListener('click', domClickHandler, { passive: false });
      
      // Store reference for cleanup
      (pathElement as any)._drawingClickHandler = domClickHandler;
      (pathElement as any)._drawingId = drawing.id;
      (pathElement as any)._globalHandlerName = globalHandlerName;
      
      console.log(`=== SUCCESSFULLY SET UP SVG PATH for drawing: ${drawing.id} ===`);
      console.log(`Drawing ID: ${pathElement.getAttribute('data-drawing-id')}`);
      console.log(`Interactive: ${pathElement.getAttribute('data-interactive')}`);
      console.log(`Global Handler: ${pathElement.getAttribute('data-global-handler')}`);
      
      return true;
    } else {
      console.warn(`Could not find SVG path element for drawing: ${drawing.id}`);
      return false;
    }
  };
  
  // Try to set up SVG path attributes immediately
  const immediate = setupSvgPathAttributes();
  
  // If immediate setup failed, retry with delays
  if (!immediate) {
    console.log(`Immediate SVG setup failed for drawing: ${drawing.id}, setting up retries`);
    
    const retryDelays = [100, 300, 500, 1000, 2000];
    retryDelays.forEach((delay, index) => {
      setTimeout(() => {
        const success = setupSvgPathAttributes();
        if (success) {
          console.log(`SVG setup succeeded on retry ${index + 1} for drawing: ${drawing.id}`);
        } else if (index === retryDelays.length - 1) {
          console.warn(`All SVG setup retries failed for drawing: ${drawing.id}`);
        }
      }, delay);
    });
  }
  
  console.log(`=== CLICK HANDLER SETUP COMPLETE for drawing: ${drawing.id} ===`);
};
