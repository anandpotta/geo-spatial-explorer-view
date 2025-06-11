
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
  
  // More robust function to find and setup SVG path elements
  const findAndSetupSvgPaths = (retryCount = 0) => {
    const maxRetries = 10;
    const retryDelay = 200;
    
    console.log(`=== SEARCHING FOR SVG PATHS for drawing: ${drawing.id}, attempt ${retryCount + 1} ===`);
    
    // Search in multiple locations for SVG paths
    const searchLocations = [
      // Search in the map container
      () => {
        const mapContainer = document.querySelector('.leaflet-map-pane');
        return mapContainer ? mapContainer.querySelectorAll('path') : [];
      },
      // Search in overlay pane
      () => {
        const overlayPane = document.querySelector('.leaflet-overlay-pane');
        return overlayPane ? overlayPane.querySelectorAll('path') : [];
      },
      // Search in SVG container
      () => {
        const svgContainer = document.querySelector('svg');
        return svgContainer ? svgContainer.querySelectorAll('path') : [];
      },
      // Search globally
      () => document.querySelectorAll('path')
    ];
    
    let pathsFound = 0;
    
    for (const searchMethod of searchLocations) {
      try {
        const pathElements = searchMethod();
        console.log(`Found ${pathElements.length} path elements in search location`);
        
        for (const pathElement of pathElements) {
          // Skip paths that already have drawing IDs assigned to avoid conflicts
          const existingDrawingId = pathElement.getAttribute('data-drawing-id');
          if (existingDrawingId && existingDrawingId !== drawing.id) {
            continue;
          }
          
          // Skip if this path already has our drawing ID
          if (existingDrawingId === drawing.id) {
            console.log(`Path already has drawing ID ${drawing.id}, skipping setup`);
            continue;
          }
          
          // Try to determine if this path belongs to our drawing
          // Check if the path is associated with our layer
          let belongsToOurLayer = false;
          
          // Method 1: Check if path has a reference to our layer
          if ((pathElement as any)._leaflet_layer === layer) {
            belongsToOurLayer = true;
            console.log(`Found path belonging to our layer via _leaflet_layer reference`);
          }
          
          // Method 2: Check parent relationships for layer group
          if (!belongsToOurLayer && typeof (layer as any).eachLayer === 'function') {
            (layer as any).eachLayer((subLayer: L.Layer) => {
              if ((pathElement as any)._leaflet_layer === subLayer) {
                belongsToOurLayer = true;
                console.log(`Found path belonging to our layer via sublayer reference`);
              }
            });
          }
          
          // Method 3: If no other paths have been set up yet and this is the first retry, assume it's ours
          if (!belongsToOurLayer && retryCount === 0 && !pathElement.hasAttribute('data-drawing-id')) {
            const allPathsWithDrawingIds = document.querySelectorAll('path[data-drawing-id]');
            if (allPathsWithDrawingIds.length === 0) {
              belongsToOurLayer = true;
              console.log(`Assuming path belongs to our layer (first unassigned path)`);
            }
          }
          
          if (belongsToOurLayer) {
            console.log(`=== SETTING UP PATH ELEMENT for drawing: ${drawing.id} ===`);
            
            // Set the required attributes
            pathElement.setAttribute('data-drawing-id', drawing.id);
            pathElement.setAttribute('data-interactive', 'true');
            pathElement.setAttribute('data-global-handler', globalHandlerName);
            
            // Verify attributes were set
            const verifyDrawingId = pathElement.getAttribute('data-drawing-id');
            const verifyInteractive = pathElement.getAttribute('data-interactive');
            const verifyGlobalHandler = pathElement.getAttribute('data-global-handler');
            
            console.log(`=== ATTRIBUTES SET ===`);
            console.log(`Drawing ID: ${verifyDrawingId}`);
            console.log(`Interactive: ${verifyInteractive}`);
            console.log(`Global Handler: ${verifyGlobalHandler}`);
            
            if (verifyDrawingId === drawing.id && verifyInteractive === 'true' && verifyGlobalHandler === globalHandlerName) {
              // Remove any existing click handlers first
              if ((pathElement as any)._drawingClickHandler) {
                pathElement.removeEventListener('click', (pathElement as any)._drawingClickHandler, true);
                pathElement.removeEventListener('click', (pathElement as any)._drawingClickHandler, false);
              }
              
              // Create the DOM click handler
              const domClickHandler = createDomClickHandler(drawing, globalHandlerName);
              
              // Add event listeners
              pathElement.addEventListener('click', domClickHandler, { 
                capture: true, 
                passive: false 
              });
              pathElement.addEventListener('click', domClickHandler, { 
                passive: false 
              });
              
              // Store reference for cleanup
              (pathElement as any)._drawingClickHandler = domClickHandler;
              (pathElement as any)._drawingId = drawing.id;
              (pathElement as any)._globalHandlerName = globalHandlerName;
              
              console.log(`=== DOM HANDLER ATTACHED to SVG path for drawing: ${drawing.id} ===`);
              pathsFound++;
            } else {
              console.error(`=== FAILED TO SET ATTRIBUTES PROPERLY for drawing: ${drawing.id} ===`);
            }
          }
        }
      } catch (error) {
        console.error(`Error in search method:`, error);
      }
    }
    
    if (pathsFound > 0) {
      console.log(`=== SUCCESSFULLY SETUP ${pathsFound} PATH(S) for drawing: ${drawing.id} ===`);
      return true;
    }
    
    // If we couldn't find any paths and we have retries left, try again
    if (retryCount < maxRetries) {
      console.log(`No paths found for drawing: ${drawing.id}, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      setTimeout(() => {
        findAndSetupSvgPaths(retryCount + 1);
      }, retryDelay);
      return false;
    } else {
      console.warn(`Could not find any SVG paths for drawing: ${drawing.id} after ${maxRetries} attempts`);
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
    });
  }
  
  // Start the search for SVG paths after a short delay to ensure DOM is ready
  setTimeout(() => {
    findAndSetupSvgPaths();
  }, 100);
  
  console.log(`=== CLICK HANDLER SETUP COMPLETE for drawing: ${drawing.id} with global handler: ${globalHandlerName} ===`);
};
