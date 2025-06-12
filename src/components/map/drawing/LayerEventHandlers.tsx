
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
  // Critical conditional checks
  if (!layer || !drawing || !drawing.id || !isMounted || !onRegionClick) {
    console.warn('Missing required parameters for layer click handler setup');
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.warn('No current user, skipping handler setup');
    return;
  }
  
  // Check if user owns this drawing or if it's public
  if (drawing.userId && drawing.userId !== currentUser.id) {
    console.warn(`User ${currentUser.id} cannot interact with drawing ${drawing.id} owned by ${drawing.userId}`);
    return;
  }
  
  console.log(`🔧 Setting up layer click handler for drawing ${drawing.id}`);
  
  // Create a unified click handler that properly stops event propagation
  const handleClick = (e: any) => {
    console.log(`🎯 Drawing ${drawing.id} click handler triggered`);
    
    // Stop all event propagation immediately
    if (e && e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      (e.originalEvent as any).__handledByLayer = true;
    }
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (e && L.DomEvent && L.DomEvent.stop) {
      L.DomEvent.stop(e);
    }
    
    // Ensure component is still mounted before calling callback
    if (isMounted && onRegionClick) {
      console.log(`✅ Calling onRegionClick for drawing ${drawing.id}`);
      onRegionClick(drawing);
    }
    
    return false;
  };
  
  // Remove any existing handlers first
  if (layer.off && typeof layer.off === 'function') {
    layer.off('click');
  }
  
  // Attach handler to the main layer if it supports events
  if (layer.on && typeof layer.on === 'function') {
    layer.on('click', handleClick);
    console.log(`✅ Main layer click handler attached for drawing ${drawing.id}`);
  }
  
  // Handle feature groups and layer groups with child layers
  if (typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((childLayer: L.Layer) => {
      if (childLayer && childLayer.on && typeof childLayer.on === 'function') {
        // Remove existing handlers on child layer
        if (childLayer.off && typeof childLayer.off === 'function') {
          childLayer.off('click');
        }
        // Attach new handler
        childLayer.on('click', handleClick);
        console.log(`✅ Child layer click handler attached for drawing ${drawing.id}`);
      }
    });
  }
  
  // Add DOM-level click handlers as a backup
  setTimeout(() => {
    if (!isMounted) return;
    
    const map = (layer as any)._map;
    if (!map || !map.getContainer) return;
    
    const container = map.getContainer();
    if (!container) return;
    
    // Find SVG paths for this specific drawing
    const drawingPaths = container.querySelectorAll(`[data-drawing-id="${drawing.id}"]`);
    
    drawingPaths.forEach((pathElement: any) => {
      if (!pathElement || pathElement.hasAttribute('data-click-handler-attached')) {
        return;
      }
      
      console.log(`🎯 Attaching DOM click handler to path for drawing ${drawing.id}`);
      
      const domClickHandler = (event: Event) => {
        console.log(`🚀 DOM click handler triggered for drawing ${drawing.id}`);
        
        // Mark as handled
        (event as any).__handledByLayer = true;
        event.stopPropagation();
        event.preventDefault();
        
        // Ensure component is still mounted
        if (isMounted && onRegionClick) {
          onRegionClick(drawing);
        }
      };
      
      pathElement.addEventListener('click', domClickHandler, { 
        capture: true,
        passive: false 
      });
      pathElement.setAttribute('data-click-handler-attached', 'true');
      pathElement.style.cursor = 'pointer';
    });
  }, 100);
  
  console.log(`✅ Layer click handler setup complete for drawing ${drawing.id}`);
};
