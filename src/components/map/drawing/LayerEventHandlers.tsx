
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
  
  console.log(`🔧 Setting up simplified click handlers for drawing ${drawing.id}`);
  
  // Remove any existing handlers first
  layer.off('click');
  
  // Create the click handler
  const handleLayerClick = (e: L.LeafletMouseEvent) => {
    console.log(`🎯 LAYER CLICK TRIGGERED for drawing ${drawing.id}`, e);
    
    // Stop event propagation using Leaflet's method
    L.DomEvent.stop(e);
    
    // Also stop the original event if available
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
    
    // Call the callback
    if (isMounted && onRegionClick) {
      console.log(`🚀 Calling onRegionClick for drawing ${drawing.id}`);
      try {
        onRegionClick(drawing);
        console.log(`✅ Successfully handled click for drawing ${drawing.id}`);
      } catch (error) {
        console.error(`❌ Error calling onRegionClick for drawing ${drawing.id}:`, error);
      }
    }
    
    return false;
  };
  
  // Set up the Leaflet layer click handler with high priority
  layer.on('click', handleLayerClick);
  
  // For feature groups, also set up handlers on child layers
  if (layer && typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((childLayer: L.Layer) => {
      console.log(`🔧 Setting up handler on child layer for drawing ${drawing.id}`);
      childLayer.off('click');
      childLayer.on('click', handleLayerClick);
      
      // Also try to set a higher event priority if the layer has a DOM element
      setTimeout(() => {
        const pathElement = (childLayer as any)._path;
        if (pathElement) {
          console.log(`🎯 Found path element for drawing ${drawing.id}, ensuring it's clickable`);
          pathElement.style.pointerEvents = 'auto';
          pathElement.style.cursor = 'pointer';
          pathElement.setAttribute('data-drawing-id', drawing.id);
          
          // Add a direct DOM click handler as backup
          const domHandler = (event: Event) => {
            console.log(`🎯 DOM BACKUP HANDLER triggered for drawing ${drawing.id}`);
            event.stopPropagation();
            event.preventDefault();
            
            if (isMounted && onRegionClick) {
              onRegionClick(drawing);
            }
          };
          
          pathElement.addEventListener('click', domHandler, { capture: true });
        }
      }, 100);
    });
  }
  
  console.log(`✅ Completed handler setup for drawing ${drawing.id}`);
};
