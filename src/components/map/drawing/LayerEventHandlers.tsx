
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
  
  console.log(`Setting up click handlers for drawing ${drawing.id}, layer type:`, layer.constructor.name);
  
  // Remove any existing handlers first
  layer.off('click');
  
  // Create a more robust click handler that ensures the event is processed
  const handleLayerClick = (e: L.LeafletMouseEvent) => {
    console.log(`🎯 LAYER CLICK HANDLER TRIGGERED for drawing ${drawing.id}`, e);
    
    // Stop ALL propagation immediately using Leaflet's method
    L.DomEvent.stop(e);
    
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.stopImmediatePropagation();
      e.originalEvent.preventDefault();
      (e.originalEvent as any).__handledByLayer = true;
    }
    
    if (isMounted && onRegionClick) {
      console.log(`🚀 Calling onRegionClick for drawing ${drawing.id}`);
      try {
        onRegionClick(drawing);
        console.log(`✅ Successfully called onRegionClick for drawing ${drawing.id}`);
      } catch (error) {
        console.error(`❌ Error calling onRegionClick for drawing ${drawing.id}:`, error);
      }
    }
    
    return false;
  };
  
  // Set up the primary Leaflet layer click handler
  layer.on('click', handleLayerClick);
  
  // For FeatureGroup layers, also set up handlers on child layers
  if (layer && typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((childLayer: L.Layer) => {
      childLayer.off('click');
      childLayer.on('click', handleLayerClick);
    });
  }
  
  // Set up DOM-level handlers with more immediate and persistent approach
  const setupDOMClickHandlers = () => {
    console.log(`Setting up DOM handlers for drawing ${drawing.id}`);
    
    // Use a more aggressive approach to find and attach to DOM elements
    const attemptDOMAttachment = () => {
      // Find all possible selectors for this drawing
      const selectors = [
        `path[data-drawing-id="${drawing.id}"]`,
        `path[stroke][fill]`, // Generic path selector
        `.leaflet-interactive`,
        `path.leaflet-interactive`,
        `svg path`
      ];
      
      let attachedCount = 0;
      
      // Try each selector and attach handlers
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
        
        elements.forEach((element) => {
          // Check if this element belongs to our drawing
          const elementDrawingId = element.getAttribute('data-drawing-id');
          const pathUid = element.getAttribute('data-path-uid');
          
          // If it has a specific drawing ID and it's not ours, skip
          if (elementDrawingId && elementDrawingId !== drawing.id) {
            return;
          }
          
          // If it has a path UID and doesn't contain our drawing ID, skip
          if (pathUid && !pathUid.includes(drawing.id)) {
            return;
          }
          
          // Remove any existing handler
          const existingHandler = (element as any).__drawingClickHandler;
          if (existingHandler) {
            element.removeEventListener('click', existingHandler, true);
            element.removeEventListener('click', existingHandler, false);
          }
          
          // Create the DOM click handler
          const domClickHandler = (event: Event) => {
            console.log(`🎯 DOM CLICK HANDLER TRIGGERED for drawing ${drawing.id}`, event);
            
            // Aggressive event stopping
            event.stopPropagation();
            event.stopImmediatePropagation();
            event.preventDefault();
            (event as any).__handledByLayer = true;
            
            if (isMounted && onRegionClick) {
              console.log(`🚀 Calling onRegionClick from DOM handler for drawing ${drawing.id}`);
              try {
                onRegionClick(drawing);
                console.log(`✅ Successfully called onRegionClick from DOM handler for drawing ${drawing.id}`);
              } catch (error) {
                console.error(`❌ Error calling onRegionClick from DOM handler for drawing ${drawing.id}:`, error);
              }
            }
            
            return false;
          };
          
          // Attach with maximum priority
          element.addEventListener('click', domClickHandler, { 
            capture: true, 
            passive: false 
          });
          
          // Also attach to bubble phase as backup
          element.addEventListener('click', domClickHandler, false);
          
          // Mark the element as having our handler
          element.setAttribute('data-drawing-id', drawing.id);
          element.style.pointerEvents = 'auto';
          element.style.cursor = 'pointer';
          
          // Store the handler for cleanup
          (element as any).__drawingClickHandler = domClickHandler;
          attachedCount++;
        });
      }
      
      if (attachedCount > 0) {
        console.log(`✅ Attached DOM handlers to ${attachedCount} elements for drawing ${drawing.id}`);
        return true;
      }
      
      console.log(`❌ No elements found to attach handlers for drawing ${drawing.id}`);
      return false;
    };
    
    // Try immediate attachment
    let success = attemptDOMAttachment();
    
    // If unsuccessful, retry with multiple attempts
    if (!success) {
      const retryDelays = [10, 50, 100, 250, 500, 1000];
      
      retryDelays.forEach((delay, index) => {
        setTimeout(() => {
          if (isMounted && !success) {
            success = attemptDOMAttachment();
            if (success) {
              console.log(`✅ DOM handlers attached on retry ${index + 1} (${delay}ms) for drawing ${drawing.id}`);
            }
          }
        }, delay);
      });
    }
    
    return success;
  };
  
  // Set up DOM handlers
  setupDOMClickHandlers();
  
  console.log(`🔧 Completed handler setup for drawing ${drawing.id}`);
};
