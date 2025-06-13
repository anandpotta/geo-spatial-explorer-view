
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
  console.log(`🔧 LayerEventHandlers: Setting up handlers for drawing ${drawing.id}`);
  console.log(`🔍 LayerEventHandlers: onRegionClick type:`, typeof onRegionClick);
  
  // Critical conditional checks
  if (!layer || !drawing?.id || !onRegionClick) {
    console.warn('❌ LayerEventHandlers: Missing required parameters:', {
      layer: !!layer,
      drawingId: drawing?.id,
      onRegionClick: typeof onRegionClick
    });
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.warn('❌ LayerEventHandlers: No current user, skipping handler setup');
    return;
  }
  
  // Check if user owns this drawing or if it's public
  if (drawing.userId && drawing.userId !== currentUser.id) {
    console.warn(`❌ LayerEventHandlers: User ${currentUser.id} cannot interact with drawing ${drawing.id} owned by ${drawing.userId}`);
    return;
  }
  
  console.log(`🔧 LayerEventHandlers: Setting up layer click handler for drawing ${drawing.id}`);
  
  // Create a simple, direct click handler
  const handleClick = (e: any) => {
    console.log(`🎯 LayerEventHandlers: Layer click handler TRIGGERED for drawing ${drawing.id}`);
    console.log(`🔍 LayerEventHandlers: Event details:`, e);
    
    // Stop event propagation
    if (e?.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
    if (e?.stopPropagation) e.stopPropagation();
    if (e?.preventDefault) e.preventDefault();
    
    console.log(`📞 LayerEventHandlers: About to call onRegionClick for drawing ${drawing.id}`);
    console.log(`🔍 LayerEventHandlers: onRegionClick function:`, onRegionClick);
    
    // Always call the callback
    try {
      onRegionClick(drawing);
      console.log(`✅ LayerEventHandlers: Successfully called onRegionClick for drawing ${drawing.id}`);
    } catch (err) {
      console.error(`❌ LayerEventHandlers: Error calling onRegionClick for drawing ${drawing.id}:`, err);
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
    console.log(`✅ LayerEventHandlers: Main layer click handler attached for drawing ${drawing.id}`);
  }
  
  // Handle feature groups with child layers
  if (typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((childLayer: L.Layer) => {
      if (childLayer?.on) {
        if (childLayer.off) {
          childLayer.off('click');
        }
        childLayer.on('click', handleClick);
        console.log(`✅ LayerEventHandlers: Child layer click handler attached for drawing ${drawing.id}`);
      }
    });
  }
  
  // Enhanced DOM-level handlers with better targeting
  const setupDOMHandlers = () => {
    const map = (layer as any)._map;
    if (!map?.getContainer) {
      console.warn(`❌ LayerEventHandlers: No map container for drawing ${drawing.id}`);
      return;
    }
    
    const container = map.getContainer();
    if (!container) {
      console.warn(`❌ LayerEventHandlers: No container element for drawing ${drawing.id}`);
      return;
    }
    
    console.log(`🔍 LayerEventHandlers: Setting up DOM handlers for drawing ${drawing.id}`);
    
    // Create DOM click handler that captures the drawing context
    const domClickHandler = (event: MouseEvent) => {
      console.log(`🚀 LayerEventHandlers: DOM click handler TRIGGERED for drawing ${drawing.id}`);
      console.log(`🔍 LayerEventHandlers: DOM event target:`, event.target);
      
      // Stop all event propagation
      event.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();
      
      console.log(`📞 LayerEventHandlers: About to call onRegionClick from DOM handler for drawing ${drawing.id}`);
      
      // Call the callback directly
      try {
        onRegionClick(drawing);
        console.log(`✅ LayerEventHandlers: Successfully called onRegionClick from DOM handler for drawing ${drawing.id}`);
      } catch (err) {
        console.error(`❌ LayerEventHandlers: Error calling onRegionClick from DOM handler for drawing ${drawing.id}:`, err);
      }
    };
    
    // Store the drawing ID globally for path identification
    if (!(window as any).drawingClickHandlers) {
      (window as any).drawingClickHandlers = new Map();
      console.log(`🔧 LayerEventHandlers: Created global drawingClickHandlers map`);
    }
    (window as any).drawingClickHandlers.set(drawing.id, { drawing, onRegionClick });
    console.log(`🗂️ LayerEventHandlers: Stored handler for drawing ${drawing.id}`, { drawing, onRegionClick: typeof onRegionClick });
    
    // Find and setup handlers for the layer's SVG path
    const setupPathHandler = (pathElement: Element) => {
      console.log(`🎯 LayerEventHandlers: Setting up path handler for drawing ${drawing.id}`, pathElement);
      
      // Remove existing handler
      const existingHandler = (pathElement as any).__clickHandler;
      if (existingHandler) {
        pathElement.removeEventListener('click', existingHandler, true);
      }
      
      // Set drawing ID attribute for identification
      pathElement.setAttribute('data-drawing-id', drawing.id);
      console.log(`🏷️ LayerEventHandlers: Set data-drawing-id="${drawing.id}" on path`);
      
      // Add new handler with capture = true for better event handling
      pathElement.addEventListener('click', domClickHandler, true);
      (pathElement as any).__clickHandler = domClickHandler;
      
      // Ensure the element is interactive
      (pathElement as HTMLElement).style.pointerEvents = 'auto';
      (pathElement as HTMLElement).style.cursor = 'pointer';
      
      console.log(`✅ LayerEventHandlers: DOM handler attached to path for drawing ${drawing.id}`);
    };
    
    // Try multiple strategies to find the SVG paths
    setTimeout(() => {
      console.log(`🔍 LayerEventHandlers: Looking for paths for drawing ${drawing.id}`);
      
      // Strategy 1: Find paths with the drawing ID
      const drawingPaths = container.querySelectorAll(`[data-drawing-id="${drawing.id}"]`);
      console.log(`🔍 LayerEventHandlers: Found ${drawingPaths.length} paths with drawing ID ${drawing.id}`);
      if (drawingPaths.length > 0) {
        drawingPaths.forEach(setupPathHandler);
        return;
      }
      
      // Strategy 2: Find the layer's path element directly
      if ((layer as any)._path) {
        console.log(`🔍 LayerEventHandlers: Found layer._path for drawing ${drawing.id}`);
        setupPathHandler((layer as any)._path);
        return;
      }
      
      // Strategy 3: Find paths in feature groups
      if (typeof (layer as any).eachLayer === 'function') {
        console.log(`🔍 LayerEventHandlers: Checking child layers for drawing ${drawing.id}`);
        (layer as any).eachLayer((childLayer: L.Layer) => {
          if ((childLayer as any)._path) {
            console.log(`🔍 LayerEventHandlers: Found child layer._path for drawing ${drawing.id}`);
            setupPathHandler((childLayer as any)._path);
          }
        });
      }
      
      // Strategy 4: Global path search as fallback
      const allPaths = container.querySelectorAll('path');
      console.log(`🔍 LayerEventHandlers: Found ${allPaths.length} total paths in container`);
      allPaths.forEach((path, index) => {
        if (!path.hasAttribute('data-drawing-id')) {
          console.log(`🔍 LayerEventHandlers: Setting up path ${index} for drawing ${drawing.id}`);
          path.setAttribute('data-drawing-id', drawing.id);
          setupPathHandler(path);
        }
      });
    }, 100);
    
    // Also setup with additional delays for paths that load later
    setTimeout(() => setupDOMHandlers(), 500);
    setTimeout(() => setupDOMHandlers(), 1000);
  };
  
  // Setup DOM handlers immediately and with retries
  setupDOMHandlers();
  
  console.log(`✅ LayerEventHandlers: Layer click handler setup complete for drawing ${drawing.id}`);
};
