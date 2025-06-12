
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
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser || (drawing.userId && drawing.userId !== currentUser.id)) {
    return;
  }
  
  console.log(`🔧 Setting up layer click handler for drawing ${drawing.id}`);
  
  // Remove any existing handlers
  layer.off('click');
  
  // Create the click handler that marks the event as handled
  const handleLayerClick = (e: L.LeafletMouseEvent) => {
    console.log(`🎯 Layer click handler triggered for drawing ${drawing.id}`);
    
    // Mark the event as handled by layer
    if (e.originalEvent) {
      (e.originalEvent as any).__handledByLayer = true;
    }
    
    // Stop propagation
    L.DomEvent.stop(e);
    
    // Call the callback
    if (isMounted && onRegionClick) {
      console.log(`✅ Calling onRegionClick for drawing ${drawing.id}`);
      onRegionClick(drawing);
    }
    
    return false;
  };
  
  // Attach to the main layer
  layer.on('click', handleLayerClick);
  
  // For feature groups, attach to child layers
  if (layer && typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((childLayer: L.Layer) => {
      childLayer.off('click');
      childLayer.on('click', handleLayerClick);
    });
  }
  
  // CRITICAL: Also set up DOM-level handlers for the SVG paths
  // This is what was missing - we need to handle clicks directly on the DOM elements
  setTimeout(() => {
    const map = (layer as any)._map;
    if (!map) return;
    
    // Find SVG paths with this drawing ID
    const container = map.getContainer();
    if (container) {
      const paths = container.querySelectorAll(`[data-drawing-id="${drawing.id}"], .leaflet-interactive`);
      
      paths.forEach((pathElement: any) => {
        if (!pathElement.hasAttribute('data-click-handler-attached')) {
          console.log(`🎯 Attaching DOM click handler to path for drawing ${drawing.id}`);
          
          const domClickHandler = (event: Event) => {
            console.log(`🚀 DOM click handler triggered for drawing ${drawing.id}`);
            
            // Mark as handled by layer
            (event as any).__handledByLayer = true;
            
            event.stopPropagation();
            event.preventDefault();
            
            if (isMounted && onRegionClick) {
              onRegionClick(drawing);
            }
          };
          
          pathElement.addEventListener('click', domClickHandler, { capture: true });
          pathElement.setAttribute('data-click-handler-attached', 'true');
          pathElement.setAttribute('data-drawing-id', drawing.id);
          pathElement.style.cursor = 'pointer';
        }
      });
    }
  }, 100);
  
  console.log(`✅ Layer click handler setup complete for drawing ${drawing.id}`);
};
