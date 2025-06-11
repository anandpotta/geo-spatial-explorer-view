
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
    console.log(`Drawing layer clicked: ${drawing.id}`);
    
    // Stop event propagation to prevent map click
    if (e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
      e.originalEvent.preventDefault();
      e.originalEvent.stopImmediatePropagation();
    }
    
    // Stop the leaflet event too
    L.DomEvent.stop(e);
    
    if (isMounted && onRegionClick) {
      console.log(`Calling onRegionClick for drawing: ${drawing.id}`);
      onRegionClick(drawing);
    }
  };
  
  // Set up the click handler on the layer
  layer.on('click', handleLayerClick);
  
  // Also set up handlers for sub-layers if this is a feature group
  if (typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((subLayer: L.Layer) => {
      console.log(`Setting up click handler for sublayer of drawing: ${drawing.id}`);
      subLayer.on('click', handleLayerClick);
      
      // For SVG paths, also attach to the DOM element directly
      if (subLayer instanceof L.Path) {
        const pathElement = (subLayer as any)._path;
        if (pathElement) {
          console.log(`Attaching DOM click handler to SVG path for drawing: ${drawing.id}`);
          pathElement.addEventListener('click', (domEvent: Event) => {
            console.log(`DOM click detected on SVG path for drawing: ${drawing.id}`);
            domEvent.stopPropagation();
            domEvent.preventDefault();
            
            // Create a mock leaflet event
            const mockEvent = {
              originalEvent: domEvent,
              target: subLayer,
              type: 'click'
            } as L.LeafletMouseEvent;
            
            handleLayerClick(mockEvent);
          }, { capture: true });
          
          // Store reference for cleanup
          (pathElement as any)._drawingClickHandler = handleLayerClick;
          (pathElement as any)._drawingId = drawing.id;
        }
      }
    });
  }
  
  console.log(`Click handler fully set up for drawing: ${drawing.id}`);
};
