
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
  
  // Ensure the global handlers map exists - create immediately
  console.log(`🔧 LayerEventHandlers: Ensuring global handlers map exists...`);
  if (!(window as any).drawingClickHandlers) {
    console.log(`🔧 LayerEventHandlers: Creating NEW global drawingClickHandlers map`);
    (window as any).drawingClickHandlers = new Map();
  } else {
    console.log(`🔧 LayerEventHandlers: Global drawingClickHandlers map ALREADY EXISTS`);
  }
  
  // First, find the actual drawing ID from the path element to ensure consistency
  let actualDrawingId = drawing.id;
  
  // Check if we can find the path element and get its drawing ID
  if (typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((childLayer: L.Layer) => {
      if ((childLayer as any)._path) {
        const pathElement = (childLayer as any)._path;
        const pathDrawingId = pathElement.getAttribute('data-drawing-id');
        if (pathDrawingId) {
          actualDrawingId = pathDrawingId;
          console.log(`🔍 LayerEventHandlers: Found path drawing ID: ${pathDrawingId}`);
        }
      }
    });
  }
  
  console.log(`🗂️ LayerEventHandlers: Current map state before storing:`, {
    exists: !!(window as any).drawingClickHandlers,
    size: (window as any).drawingClickHandlers?.size || 'N/A',
    keys: (window as any).drawingClickHandlers ? Array.from((window as any).drawingClickHandlers.keys()) : 'No map'
  });
  
  // Store the handler using the actual drawing ID from the path element
  console.log(`🗂️ LayerEventHandlers: About to store handler for drawing ${actualDrawingId}`);
  console.log(`🗂️ LayerEventHandlers: Storing drawing object:`, JSON.stringify(drawing, null, 2));
  console.log(`🗂️ LayerEventHandlers: Storing onRegionClick type:`, typeof onRegionClick);
  
  try {
    // Force create a new map instance if it's getting corrupted
    if (!(window as any).drawingClickHandlers || typeof (window as any).drawingClickHandlers.set !== 'function') {
      console.log(`🔧 LayerEventHandlers: Recreating handlers map due to corruption`);
      (window as any).drawingClickHandlers = new Map();
    }
    
    // Store using the actual drawing ID that matches the path element
    (window as any).drawingClickHandlers.set(actualDrawingId, { drawing, onRegionClick });
    console.log(`✅ LayerEventHandlers: Handler stored IMMEDIATELY for drawing ${actualDrawingId}`);
    
    // Immediate verification
    const stored = (window as any).drawingClickHandlers.get(actualDrawingId);
    console.log(`🔍 LayerEventHandlers: Immediate verification - stored handler:`, {
      exists: !!stored,
      drawingId: stored?.drawing?.id,
      onRegionClickType: typeof stored?.onRegionClick
    });
    
    // Also dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('handlerRegistered', {
      detail: { drawingId: actualDrawingId }
    }));
    
  } catch (error) {
    console.error(`❌ LayerEventHandlers: Error storing handler:`, error);
    return;
  }
  
  console.log(`🗂️ LayerEventHandlers: Map state after storing:`, {
    size: (window as any).drawingClickHandlers.size,
    keys: Array.from((window as any).drawingClickHandlers.keys()),
    hasOurDrawing: (window as any).drawingClickHandlers.has(actualDrawingId)
  });
  
  // Create a simple, direct click handler
  const handleClick = (e: any) => {
    console.log(`🎯 LayerEventHandlers: Layer click handler TRIGGERED for drawing ${actualDrawingId}`);
    console.log(`🔍 LayerEventHandlers: Event details:`, e);
    
    // Stop event propagation
    if (e?.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
    if (e?.stopPropagation) e.stopPropagation();
    if (e?.preventDefault) e.preventDefault();
    
    console.log(`📞 LayerEventHandlers: About to call onRegionClick for drawing ${actualDrawingId}`);
    console.log(`🔍 LayerEventHandlers: onRegionClick function:`, onRegionClick);
    
    // Always call the callback - let the callback handle authentication
    try {
      onRegionClick(drawing);
      console.log(`✅ LayerEventHandlers: Successfully called onRegionClick for drawing ${actualDrawingId}`);
    } catch (err) {
      console.error(`❌ LayerEventHandlers: Error calling onRegionClick for drawing ${actualDrawingId}:`, err);
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
    console.log(`✅ LayerEventHandlers: Main layer click handler attached for drawing ${actualDrawingId}`);
  }
  
  // Handle feature groups with child layers and ensure path elements have correct drawing ID
  if (typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((childLayer: L.Layer) => {
      if (childLayer?.on) {
        if (childLayer.off) {
          childLayer.off('click');
        }
        childLayer.on('click', handleClick);
        console.log(`✅ LayerEventHandlers: Child layer click handler attached for drawing ${actualDrawingId}`);
        
        // Ensure the path element has the correct drawing ID attribute that matches our handler key
        if ((childLayer as any)._path) {
          const pathElement = (childLayer as any)._path;
          const currentDrawingId = pathElement.getAttribute('data-drawing-id');
          
          console.log(`🔍 LayerEventHandlers: Path element drawing ID check:`, {
            currentId: currentDrawingId,
            expectedId: actualDrawingId,
            needsUpdate: currentDrawingId !== actualDrawingId
          });
          
          // Always ensure the path element has the same ID we're using for the handler
          console.log(`🔧 LayerEventHandlers: Setting path element drawing ID to ${actualDrawingId}`);
          pathElement.setAttribute('data-drawing-id', actualDrawingId);
          pathElement.setAttribute('id', `drawing-path-${actualDrawingId}`);
          pathElement.setAttribute('data-path-uid', `uid-${actualDrawingId}-${Date.now()}`);
          
          // Verify the update
          const updatedId = pathElement.getAttribute('data-drawing-id');
          console.log(`✅ LayerEventHandlers: Path element ID updated successfully:`, {
            oldId: currentDrawingId,
            newId: updatedId,
            success: updatedId === actualDrawingId
          });
        }
      }
    });
  }
  
  console.log(`🏁 LayerEventHandlers: Setup complete for drawing ${actualDrawingId}`);
  console.log(`🗂️ LayerEventHandlers: Final verification - handlers map:`, {
    size: (window as any).drawingClickHandlers.size,
    keys: Array.from((window as any).drawingClickHandlers.keys()),
    hasDrawingId: (window as any).drawingClickHandlers.has(actualDrawingId)
  });
};
