
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
  if (!layer || !drawing?.id || !onRegionClick) {
    console.warn('Missing required parameters for click handler setup');
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
  
  // Create a simple, direct click handler
  const handleClick = (e: any) => {
    console.log(`🎯 Layer click handler TRIGGERED for drawing ${drawing.id} - Calling onRegionClick!`);
    
    // Stop event propagation
    if (e?.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
    if (e?.stopPropagation) e.stopPropagation();
    if (e?.preventDefault) e.preventDefault();
    
    // Always call the callback - remove the isMounted check that might be blocking execution
    onRegionClick(drawing);
    
    return false;
  };
  
  // Remove existing handlers first
  if (layer.off) {
    layer.off('click');
  }
  
  // Attach handler to main layer
  if (layer.on) {
    layer.on('click', handleClick);
    console.log(`✅ Main layer click handler attached for drawing ${drawing.id}`);
  }
  
  // Handle feature groups with child layers
  if (typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((childLayer: L.Layer) => {
      if (childLayer?.on) {
        if (childLayer.off) {
          childLayer.off('click');
        }
        childLayer.on('click', handleClick);
        console.log(`✅ Child layer click handler attached for drawing ${drawing.id}`);
      }
    });
  }
  
  // Set up DOM-level handlers as backup
  const setupDOMHandlers = () => {
    const map = (layer as any)._map;
    if (!map?.getContainer) return;
    
    const container = map.getContainer();
    if (!container) return;
    
    console.log(`🔍 Setting up DOM handlers for drawing ${drawing.id}`);
    
    // Create DOM click handler
    const domClickHandler = (event: MouseEvent) => {
      console.log(`🚀 DOM click handler TRIGGERED for drawing ${drawing.id} - Calling onRegionClick!`);
      
      // Stop all event propagation
      event.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();
      
      // Call the callback directly
      onRegionClick(drawing);
    };
    
    // Find SVG paths with the drawing ID
    const drawingPaths = container.querySelectorAll(`[data-drawing-id="${drawing.id}"]`);
    
    if (drawingPaths.length > 0) {
      drawingPaths.forEach((pathElement) => {
        // Remove existing handler
        const existingHandler = (pathElement as any).__clickHandler;
        if (existingHandler) {
          pathElement.removeEventListener('click', existingHandler, true);
        }
        
        // Add new handler with capture = true
        pathElement.addEventListener('click', domClickHandler, true);
        (pathElement as any).__clickHandler = domClickHandler;
        
        // Ensure the element is interactive
        (pathElement as HTMLElement).style.pointerEvents = 'auto';
        (pathElement as HTMLElement).style.cursor = 'pointer';
        
        console.log(`✅ DOM handler attached to path for drawing ${drawing.id}`);
      });
    } else {
      // Fallback: find the layer's path element and mark it
      if ((layer as any)._path) {
        const layerPath = (layer as any)._path;
        layerPath.setAttribute('data-drawing-id', drawing.id);
        
        // Remove existing handler
        const existingHandler = (layerPath as any).__clickHandler;
        if (existingHandler) {
          layerPath.removeEventListener('click', existingHandler, true);
        }
        
        // Add new handler
        layerPath.addEventListener('click', domClickHandler, true);
        (layerPath as any).__clickHandler = domClickHandler;
        
        // Ensure the element is interactive
        layerPath.style.pointerEvents = 'auto';
        layerPath.style.cursor = 'pointer';
        
        console.log(`✅ DOM handler attached to layer path for drawing ${drawing.id}`);
      }
    }
  };
  
  // Setup DOM handlers immediately and with retries
  setupDOMHandlers();
  setTimeout(() => setupDOMHandlers(), 100);
  setTimeout(() => setupDOMHandlers(), 500);
  
  console.log(`✅ Layer click handler setup complete for drawing ${drawing.id}`);
};
