
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
  
  // Initialize the global handlers map if it doesn't exist
  if (!(window as any).drawingClickHandlers) {
    (window as any).drawingClickHandlers = new Map();
    console.log(`🔧 LayerEventHandlers: Created global drawingClickHandlers map`);
  }
  
  // Store the handler immediately
  (window as any).drawingClickHandlers.set(drawing.id, { drawing, onRegionClick });
  console.log(`🗂️ LayerEventHandlers: Stored handler for drawing ${drawing.id}`, { 
    drawing: drawing.id, 
    onRegionClick: typeof onRegionClick,
    totalHandlers: (window as any).drawingClickHandlers.size
  });
  
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
  
  // Enhanced DOM-level handlers with immediate setup
  const setupDOMHandlers = () => {
    console.log(`🔍 LayerEventHandlers: Setting up DOM handlers for drawing ${drawing.id}`);
    
    // Find and setup handlers for the layer's SVG path immediately
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
      
      // Add new handler with capture = true for better event handling
      pathElement.addEventListener('click', domClickHandler, true);
      (pathElement as any).__clickHandler = domClickHandler;
      
      // Ensure the element is interactive
      (pathElement as HTMLElement).style.pointerEvents = 'auto';
      (pathElement as HTMLElement).style.cursor = 'pointer';
      
      console.log(`✅ LayerEventHandlers: DOM handler attached to path for drawing ${drawing.id}`);
    };
    
    // Strategy 1: Find the layer's path element directly
    if ((layer as any)._path) {
      console.log(`🔍 LayerEventHandlers: Found layer._path for drawing ${drawing.id}`);
      setupPathHandler((layer as any)._path);
      return;
    }
    
    // Strategy 2: Find paths in feature groups
    if (typeof (layer as any).eachLayer === 'function') {
      console.log(`🔍 LayerEventHandlers: Checking child layers for drawing ${drawing.id}`);
      (layer as any).eachLayer((childLayer: L.Layer) => {
        if ((childLayer as any)._path) {
          console.log(`🔍 LayerEventHandlers: Found child layer._path for drawing ${drawing.id}`);
          setupPathHandler((childLayer as any)._path);
        }
      });
    }
  };
  
  // Setup DOM handlers immediately and with a small delay
  setupDOMHandlers();
  setTimeout(() => setupDOMHandlers(), 100);
  setTimeout(() => setupDOMHandlers(), 500);
  
  console.log(`✅ LayerEventHandlers: Layer click handler setup complete for drawing ${drawing.id}`);
  console.log(`🗂️ LayerEventHandlers: Current handlers in global map:`, 
    Array.from((window as any).drawingClickHandlers.keys()));
};
