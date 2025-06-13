
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
  console.log(`🚀 LayerEventHandlers: setupLayerClickHandlers CALLED for drawing ${drawing.id}`);
  console.log(`🔍 LayerEventHandlers: Function parameters:`, {
    layer: !!layer,
    layerType: layer?.constructor?.name,
    drawingId: drawing?.id,
    drawingUserId: drawing?.userId,
    isMounted,
    onRegionClick: typeof onRegionClick,
    onRegionClickExists: !!onRegionClick
  });
  
  // Critical conditional checks
  if (!layer) {
    console.error('❌ LayerEventHandlers: Layer is null/undefined, aborting');
    return;
  }
  
  if (!drawing?.id) {
    console.error('❌ LayerEventHandlers: Drawing or drawing.id is null/undefined, aborting');
    return;
  }
  
  if (!onRegionClick) {
    console.error('❌ LayerEventHandlers: onRegionClick callback is null/undefined, aborting');
    return;
  }
  
  const currentUser = getCurrentUser();
  console.log(`👤 LayerEventHandlers: Current user:`, currentUser?.id || 'none');
  
  // Always set up handlers for existing drawings - the onRegionClick callback will handle auth
  console.log(`✅ LayerEventHandlers: Setting up click handlers for drawing ${drawing.id}`);
  
  // Ensure the global handlers map exists
  console.log(`🔧 LayerEventHandlers: Checking global handlers map...`);
  if (!(window as any).drawingClickHandlers) {
    console.log(`🔧 LayerEventHandlers: Creating NEW global drawingClickHandlers map`);
    (window as any).drawingClickHandlers = new Map();
  } else {
    console.log(`🔧 LayerEventHandlers: Global drawingClickHandlers map ALREADY EXISTS`);
  }
  
  console.log(`🗂️ LayerEventHandlers: Current map state before storing:`, {
    exists: !!(window as any).drawingClickHandlers,
    size: (window as any).drawingClickHandlers?.size || 'N/A',
    keys: (window as any).drawingClickHandlers ? Array.from((window as any).drawingClickHandlers.keys()) : 'No map'
  });
  
  // Store the handler with comprehensive logging
  console.log(`🗂️ LayerEventHandlers: About to store handler for drawing ${drawing.id}`);
  console.log(`🗂️ LayerEventHandlers: Storing drawing object:`, JSON.stringify(drawing, null, 2));
  console.log(`🗂️ LayerEventHandlers: Storing onRegionClick type:`, typeof onRegionClick);
  console.log(`🗂️ LayerEventHandlers: Storing onRegionClick function:`, onRegionClick.toString().substring(0, 200));
  
  try {
    // Force create a new map instance if it's getting corrupted
    if (!(window as any).drawingClickHandlers || typeof (window as any).drawingClickHandlers.set !== 'function') {
      console.log(`🔧 LayerEventHandlers: Recreating handlers map due to corruption`);
      (window as any).drawingClickHandlers = new Map();
    }
    
    (window as any).drawingClickHandlers.set(drawing.id, { drawing, onRegionClick });
    console.log(`✅ LayerEventHandlers: Handler stored successfully for drawing ${drawing.id}`);
    
    // Immediate verification
    const stored = (window as any).drawingClickHandlers.get(drawing.id);
    console.log(`🔍 LayerEventHandlers: Immediate verification - stored handler:`, {
      exists: !!stored,
      drawingId: stored?.drawing?.id,
      onRegionClickType: typeof stored?.onRegionClick
    });
    
    // Also dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('handlerRegistered', {
      detail: { drawingId: drawing.id }
    }));
    
  } catch (error) {
    console.error(`❌ LayerEventHandlers: Error storing handler:`, error);
    return;
  }
  
  console.log(`🗂️ LayerEventHandlers: Map state after storing:`, {
    size: (window as any).drawingClickHandlers.size,
    keys: Array.from((window as any).drawingClickHandlers.keys()),
    hasOurDrawing: (window as any).drawingClickHandlers.has(drawing.id)
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
    
    // Always call the callback - let the callback handle authentication
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
  
  console.log(`🏁 LayerEventHandlers: Setup complete for drawing ${drawing.id}`);
  console.log(`🗂️ LayerEventHandlers: Final verification - handlers map:`, {
    size: (window as any).drawingClickHandlers.size,
    keys: Array.from((window as any).drawingClickHandlers.keys()),
    hasDrawingId: (window as any).drawingClickHandlers.has(drawing.id)
  });
};
