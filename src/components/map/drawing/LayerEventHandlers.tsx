
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
  
  console.log(`Setting up click handler for drawing: ${drawing.id}, user: ${effectiveUserId}`);
  
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
      
      // For SVG paths, also attach to the DOM element directly with immediate trigger
      if (subLayer instanceof L.Path) {
        const pathElement = (subLayer as any)._path;
        if (pathElement) {
          console.log(`Attaching DOM click handler to SVG path for drawing: ${drawing.id}`);
          
          // Set data attributes for identification
          pathElement.setAttribute('data-drawing-id', drawing.id);
          pathElement.setAttribute('data-interactive', 'true');
          
          // Remove any existing click handlers first
          if ((pathElement as any)._drawingClickHandler) {
            pathElement.removeEventListener('click', (pathElement as any)._drawingClickHandler, true);
          }
          
          const domClickHandler = (domEvent: Event) => {
            console.log(`=== DOM CLICK DETECTED on SVG path for drawing: ${drawing.id} ===`);
            console.log('DOM event details:', domEvent);
            
            // Immediately stop all propagation
            domEvent.stopPropagation();
            domEvent.preventDefault();
            domEvent.stopImmediatePropagation();
            
            // Directly call the region click handler instead of creating mock event
            console.log(`=== DIRECTLY CALLING onRegionClick from DOM event for drawing: ${drawing.id} ===`);
            if (isMounted && onRegionClick) {
              try {
                onRegionClick(drawing);
                console.log(`=== onRegionClick called successfully from DOM handler for drawing: ${drawing.id} ===`);
              } catch (error) {
                console.error(`Error calling onRegionClick from DOM handler for drawing ${drawing.id}:`, error);
              }
            } else {
              console.warn(`Cannot call onRegionClick from DOM - isMounted: ${isMounted}, onRegionClick: ${!!onRegionClick}`);
            }
          };
          
          // Use capture phase and immediate priority
          pathElement.addEventListener('click', domClickHandler, { 
            capture: true, 
            passive: false 
          });
          
          // Store reference for cleanup
          (pathElement as any)._drawingClickHandler = domClickHandler;
          (pathElement as any)._drawingId = drawing.id;
          
          console.log(`DOM click handler fully attached to SVG path for drawing: ${drawing.id}`);
        } else {
          console.warn(`No path element found for drawing: ${drawing.id}`);
        }
      }
    });
  }
  
  console.log(`Click handler fully set up for drawing: ${drawing.id}`);
};
