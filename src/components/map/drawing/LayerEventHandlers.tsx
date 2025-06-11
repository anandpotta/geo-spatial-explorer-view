
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
  
  // Enhanced DOM click handler that calls the global function
  const createDomClickHandler = (drawingData: DrawingData, globalHandlerName: string) => {
    return (domEvent: Event) => {
      console.log(`=== DOM CLICK DETECTED on SVG path for drawing: ${drawingData.id} ===`);
      console.log('DOM event details:', {
        type: domEvent.type,
        target: domEvent.target,
        currentTarget: domEvent.currentTarget
      });
      
      // Immediately stop all propagation
      domEvent.stopPropagation();
      domEvent.preventDefault();
      domEvent.stopImmediatePropagation();
      
      // Call the global handler
      console.log(`=== CALLING GLOBAL HANDLER: ${globalHandlerName} ===`);
      if ((window as any)[globalHandlerName]) {
        (window as any)[globalHandlerName]();
      } else {
        console.error(`Global handler ${globalHandlerName} not found`);
        // List available global handlers for debugging
        const availableHandlers = Object.keys(window).filter(key => key.startsWith('triggerDrawingClick_'));
        console.log('Available global handlers:', availableHandlers);
      }
    };
  };
  
  // Function to set attributes on path elements with retry mechanism
  const setPathAttributes = (pathElement: HTMLElement, drawingId: string, globalHandlerName: string) => {
    if (!pathElement) return false;
    
    try {
      console.log(`=== SETTING ATTRIBUTES on path element for drawing: ${drawingId} ===`);
      pathElement.setAttribute('data-drawing-id', drawingId);
      pathElement.setAttribute('data-interactive', 'true');
      pathElement.setAttribute('data-global-handler', globalHandlerName);
      
      // Verify attributes were set
      const verifyDrawingId = pathElement.getAttribute('data-drawing-id');
      const verifyInteractive = pathElement.getAttribute('data-interactive');
      const verifyGlobalHandler = pathElement.getAttribute('data-global-handler');
      
      console.log(`=== ATTRIBUTES VERIFICATION for drawing: ${drawingId} ===`);
      console.log(`Drawing ID: ${verifyDrawingId}, Interactive: ${verifyInteractive}, Global Handler: ${verifyGlobalHandler}`);
      
      if (verifyDrawingId === drawingId && verifyInteractive === 'true' && verifyGlobalHandler === globalHandlerName) {
        console.log(`=== ATTRIBUTES SET SUCCESSFULLY for drawing: ${drawingId} ===`);
        return true;
      } else {
        console.error(`=== ATTRIBUTES NOT SET PROPERLY for drawing: ${drawingId} ===`);
        return false;
      }
    } catch (error) {
      console.error(`Error setting attributes on path element for drawing ${drawingId}:`, error);
      return false;
    }
  };
  
  // Function to find and setup path elements with retry
  const setupPathElements = (subLayer: L.Layer, retryCount = 0) => {
    const maxRetries = 5;
    const retryDelay = 100;
    
    // Try multiple ways to get the path element
    let pathElement = null;
    
    // Method 1: Direct _path property
    if ((subLayer as any)._path) {
      pathElement = (subLayer as any)._path;
      console.log(`Found path element via _path property for drawing: ${drawing.id}`);
    }
    
    // Method 2: Try _renderer and _path
    if (!pathElement && (subLayer as any)._renderer && (subLayer as any)._renderer._rootGroup) {
      const rootGroup = (subLayer as any)._renderer._rootGroup;
      const pathElements = rootGroup.querySelectorAll('path');
      if (pathElements.length > 0) {
        // Find the path that belongs to this layer
        for (const path of pathElements) {
          if ((path as any)._leaflet_layer === subLayer) {
            pathElement = path;
            console.log(`Found path element via renderer for drawing: ${drawing.id}`);
            break;
          }
        }
      }
    }
    
    // Method 3: Try to find via container
    if (!pathElement && (subLayer as any)._container) {
      const container = (subLayer as any)._container;
      pathElement = container.querySelector('path');
      if (pathElement) {
        console.log(`Found path element via container for drawing: ${drawing.id}`);
      }
    }
    
    if (pathElement) {
      const success = setPathAttributes(pathElement, drawing.id, globalHandlerName);
      if (success) {
        // Remove any existing click handlers first
        if ((pathElement as any)._drawingClickHandler) {
          pathElement.removeEventListener('click', (pathElement as any)._drawingClickHandler, true);
        }
        
        // Create the DOM click handler
        const domClickHandler = createDomClickHandler(drawing, globalHandlerName);
        
        // Use capture phase and immediate priority
        pathElement.addEventListener('click', domClickHandler, { 
          capture: true, 
          passive: false 
        });
        
        // Store reference for cleanup
        (pathElement as any)._drawingClickHandler = domClickHandler;
        (pathElement as any)._drawingId = drawing.id;
        (pathElement as any)._globalHandlerName = globalHandlerName;
        
        // Also add the handler for the normal phase as backup
        pathElement.addEventListener('click', domClickHandler, { 
          passive: false 
        });
        
        console.log(`=== DOM HANDLER ATTACHED to SVG path for drawing: ${drawing.id} with global handler: ${globalHandlerName} ===`);
        return true;
      }
    }
    
    // If we couldn't find/setup the path element and we have retries left, try again
    if (retryCount < maxRetries) {
      console.log(`Retrying path element setup for drawing: ${drawing.id}, attempt ${retryCount + 1}/${maxRetries}`);
      setTimeout(() => {
        setupPathElements(subLayer, retryCount + 1);
      }, retryDelay);
      return false;
    } else {
      console.warn(`Could not find or setup path element for drawing: ${drawing.id} after ${maxRetries} attempts`);
      return false;
    }
  };
  
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
      
      // For SVG paths, also attach to the DOM element directly with global handler
      if (subLayer instanceof L.Path) {
        // Use setTimeout to ensure the DOM element is ready
        setTimeout(() => {
          setupPathElements(subLayer);
        }, 10);
      }
    });
  }
  
  // If this is a Path layer directly, set up the path element
  if (layer instanceof L.Path) {
    setTimeout(() => {
      setupPathElements(layer);
    }, 10);
  }
  
  console.log(`=== CLICK HANDLER SETUP COMPLETE for drawing: ${drawing.id} with global handler: ${globalHandlerName} ===`);
};
