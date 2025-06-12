
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
  
  // Enhanced DOM-level handlers with better element finding
  const setupDOMClickHandlers = () => {
    console.log(`Setting up DOM handlers for drawing ${drawing.id}`);
    
    const attemptDOMAttachment = (): boolean => {
      let attachedCount = 0;
      
      // Wait for Leaflet to render the layer to DOM
      setTimeout(() => {
        // Try to get the actual path element from the layer
        const layerElement = (layer as any)._path;
        if (layerElement) {
          console.log(`Found layer path element directly for drawing ${drawing.id}`);
          
          // Remove existing handler
          const existingHandler = (layerElement as any).__drawingClickHandler;
          if (existingHandler) {
            layerElement.removeEventListener('click', existingHandler, true);
            layerElement.removeEventListener('click', existingHandler, false);
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
          layerElement.addEventListener('click', domClickHandler, { 
            capture: true, 
            passive: false 
          });
          
          // Mark the element as having our handler
          layerElement.setAttribute('data-drawing-id', drawing.id);
          layerElement.style.pointerEvents = 'auto';
          layerElement.style.cursor = 'pointer';
          
          // Store the handler for cleanup
          (layerElement as any).__drawingClickHandler = domClickHandler;
          attachedCount++;
          
          console.log(`✅ Attached DOM handler directly to layer element for drawing ${drawing.id}`);
        }
        
        // Also try child layers if it's a feature group
        if ((layer as any).eachLayer) {
          (layer as any).eachLayer((childLayer: any) => {
            const childElement = childLayer._path;
            if (childElement) {
              console.log(`Found child layer path element for drawing ${drawing.id}`);
              
              // Remove existing handler
              const existingHandler = (childElement as any).__drawingClickHandler;
              if (existingHandler) {
                childElement.removeEventListener('click', existingHandler, true);
                childElement.removeEventListener('click', existingHandler, false);
              }
              
              // Create the DOM click handler
              const domClickHandler = (event: Event) => {
                console.log(`🎯 CHILD DOM CLICK HANDLER TRIGGERED for drawing ${drawing.id}`, event);
                
                // Aggressive event stopping
                event.stopPropagation();
                event.stopImmediatePropagation();
                event.preventDefault();
                (event as any).__handledByLayer = true;
                
                if (isMounted && onRegionClick) {
                  console.log(`🚀 Calling onRegionClick from child DOM handler for drawing ${drawing.id}`);
                  try {
                    onRegionClick(drawing);
                    console.log(`✅ Successfully called onRegionClick from child DOM handler for drawing ${drawing.id}`);
                  } catch (error) {
                    console.error(`❌ Error calling onRegionClick from child DOM handler for drawing ${drawing.id}:`, error);
                  }
                }
                
                return false;
              };
              
              // Attach with maximum priority
              childElement.addEventListener('click', domClickHandler, { 
                capture: true, 
                passive: false 
              });
              
              // Mark the element as having our handler
              childElement.setAttribute('data-drawing-id', drawing.id);
              childElement.style.pointerEvents = 'auto';
              childElement.style.cursor = 'pointer';
              
              // Store the handler for cleanup
              (childElement as any).__drawingClickHandler = domClickHandler;
              attachedCount++;
            }
          });
        }
        
        if (attachedCount > 0) {
          console.log(`✅ Successfully attached ${attachedCount} DOM handlers for drawing ${drawing.id}`);
        } else {
          console.warn(`❌ No DOM elements found to attach handlers for drawing ${drawing.id}`);
        }
      }, 100); // Give Leaflet time to render
      
      return true;
    };
    
    // Try immediate attachment and also with delays
    attemptDOMAttachment();
    
    // Retry with longer delays to catch late-rendering elements
    const retryDelays = [250, 500, 1000];
    retryDelays.forEach((delay) => {
      setTimeout(() => {
        if (isMounted) {
          attemptDOMAttachment();
        }
      }, delay);
    });
  };
  
  // Set up DOM handlers
  setupDOMClickHandlers();
  
  console.log(`🔧 Completed handler setup for drawing ${drawing.id}`);
};
