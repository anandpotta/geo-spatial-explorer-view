
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
  if (!layer || !drawing?.id || !isMounted || !onRegionClick) {
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
  
  // Create the click handler
  const handleClick = (e: any) => {
    console.log(`🎯 Layer click handler TRIGGERED for drawing ${drawing.id} - SUCCESS!`);
    
    // Stop event propagation
    if (e?.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      (e.originalEvent as any).__handledByLayer = true;
    }
    if (e?.stopPropagation) {
      e.stopPropagation();
    }
    
    // Call the callback if component is still mounted
    if (isMounted && onRegionClick) {
      console.log(`✅ Calling onRegionClick for drawing ${drawing.id}`);
      onRegionClick(drawing);
    }
    
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
  
  // Set up DOM-level handlers as fallback
  const setupDOMHandlers = () => {
    if (!isMounted) return;
    
    const map = (layer as any)._map;
    if (!map?.getContainer) return;
    
    const container = map.getContainer();
    if (!container) return;
    
    console.log(`🔍 Setting up DOM handlers for drawing ${drawing.id}`);
    
    // Create DOM click handler
    const domClickHandler = (event: Event) => {
      console.log(`🚀 DOM click handler TRIGGERED for drawing ${drawing.id} - SUCCESS!`);
      
      event.stopPropagation();
      event.preventDefault();
      (event as any).__handledByLayer = true;
      
      if (isMounted && onRegionClick) {
        console.log(`✅ Calling onRegionClick from DOM handler for drawing ${drawing.id}`);
        onRegionClick(drawing);
      }
    };
    
    // Strategy 1: Find by data-drawing-id
    const drawingPaths = container.querySelectorAll(`[data-drawing-id="${drawing.id}"]`);
    drawingPaths.forEach((pathElement) => {
      if (pathElement instanceof Element) {
        // Remove existing handler
        const existingHandler = (pathElement as any).__clickHandler;
        if (existingHandler) {
          pathElement.removeEventListener('click', existingHandler);
        }
        
        // Add new handler
        pathElement.addEventListener('click', domClickHandler, { 
          capture: true,
          passive: false 
        });
        
        (pathElement as any).__clickHandler = domClickHandler;
        pathElement.setAttribute('data-click-handler-attached', 'true');
        (pathElement as HTMLElement).style.cursor = 'pointer';
        
        console.log(`✅ DOM handler attached to path for drawing ${drawing.id}`);
      }
    });
    
    // Strategy 2: If no paths found, try to find the layer's path element
    if (drawingPaths.length === 0 && (layer as any)._path) {
      const layerPath = (layer as any)._path;
      if (layerPath instanceof Element) {
        layerPath.setAttribute('data-drawing-id', drawing.id);
        
        const existingHandler = (layerPath as any).__clickHandler;
        if (existingHandler) {
          layerPath.removeEventListener('click', existingHandler);
        }
        
        layerPath.addEventListener('click', domClickHandler, { 
          capture: true,
          passive: false 
        });
        
        (layerPath as any).__clickHandler = domClickHandler;
        layerPath.setAttribute('data-click-handler-attached', 'true');
        (layerPath as HTMLElement).style.cursor = 'pointer';
        
        console.log(`✅ DOM handler attached to layer path for drawing ${drawing.id}`);
      }
    }
    
    // Strategy 3: Find most recent interactive path without handler
    if (drawingPaths.length === 0) {
      const allPaths = container.querySelectorAll('path.leaflet-interactive:not([data-click-handler-attached])');
      if (allPaths.length > 0) {
        const targetPath = allPaths[allPaths.length - 1];
        if (targetPath instanceof Element) {
          targetPath.setAttribute('data-drawing-id', drawing.id);
          
          targetPath.addEventListener('click', domClickHandler, { 
            capture: true,
            passive: false 
          });
          
          (targetPath as any).__clickHandler = domClickHandler;
          targetPath.setAttribute('data-click-handler-attached', 'true');
          (targetPath as HTMLElement).style.cursor = 'pointer';
          
          console.log(`✅ DOM handler attached to unhandled path for drawing ${drawing.id}`);
        }
      }
    }
  };
  
  // Try immediate setup
  setupDOMHandlers();
  
  // Try again after short delays to catch elements that render later
  setTimeout(() => {
    if (isMounted) setupDOMHandlers();
  }, 100);
  
  setTimeout(() => {
    if (isMounted) setupDOMHandlers();
  }, 500);
  
  console.log(`✅ Layer click handler setup complete for drawing ${drawing.id}`);
};
