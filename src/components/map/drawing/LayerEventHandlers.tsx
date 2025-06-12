
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
  if (!layer) {
    console.warn('Layer is missing for click handler setup');
    return;
  }
  
  if (!drawing || !drawing.id) {
    console.warn('Drawing or drawing.id is missing for click handler setup');
    return;
  }
  
  if (!isMounted) {
    console.warn('Component not mounted, skipping handler setup');
    return;
  }
  
  if (!onRegionClick) {
    console.warn('onRegionClick callback is missing for click handler setup');
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
    console.log(`🎯 Drawing ${drawing.id} click handler TRIGGERED - SUCCESS!`);
    
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
    console.log(`🧹 Removed existing click handler for drawing ${drawing.id}`);
  }
  
  // Attach handler to the main layer if it supports events
  if (layer.on && typeof layer.on === 'function') {
    layer.on('click', handleClick);
    console.log(`✅ Main layer click handler attached for drawing ${drawing.id}`);
  } else {
    console.warn(`Layer for drawing ${drawing.id} does not support event attachment`);
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
  
  // Enhanced DOM-level click handlers with better element detection
  const setupDOMHandlers = () => {
    if (!isMounted) {
      console.log(`Component unmounted before DOM handler setup for ${drawing.id}`);
      return;
    }
    
    const map = (layer as any)._map;
    if (!map || !map.getContainer) {
      console.warn(`No map container found for drawing ${drawing.id}`);
      return;
    }
    
    const container = map.getContainer();
    if (!container) {
      console.warn(`Map container is null for drawing ${drawing.id}`);
      return;
    }
    
    console.log(`🔍 Setting up DOM handlers for drawing ${drawing.id}`);
    
    // Type guard function to check if an element is a valid DOM Element
    const isElement = (node: unknown): node is Element => {
      return node !== null && 
             typeof node === 'object' && 
             'nodeType' in node && 
             (node as any).nodeType === Node.ELEMENT_NODE;
    };
    
    // First, try to set the data attribute on the layer's DOM element
    if ((layer as any)._path) {
      const pathElement = (layer as any)._path;
      if (pathElement && typeof pathElement.setAttribute === 'function') {
        pathElement.setAttribute('data-drawing-id', drawing.id);
        console.log(`✅ Set data-drawing-id on layer path for ${drawing.id}`);
      }
    }
    
    // Function to attach handler to a path element
    const attachToPath = (pathElement: Element, source: string) => {
      if (!pathElement) {
        return false;
      }
      
      // Set the data attribute if not present
      if (!pathElement.getAttribute('data-drawing-id')) {
        pathElement.setAttribute('data-drawing-id', drawing.id);
      }
      
      console.log(`🎯 Attaching DOM click handler to path from ${source} for drawing ${drawing.id}`);
      
      const domClickHandler = (event: Event) => {
        console.log(`🚀 DOM click handler TRIGGERED for drawing ${drawing.id} - SUCCESS!`);
        
        // Mark as handled
        (event as any).__handledByLayer = true;
        event.stopPropagation();
        event.preventDefault();
        
        // Ensure component is still mounted
        if (isMounted && onRegionClick) {
          console.log(`✅ Calling onRegionClick from DOM handler for drawing ${drawing.id}`);
          onRegionClick(drawing);
        }
      };
      
      // Remove any existing click handlers first
      const existingHandler = (pathElement as any).__clickHandler;
      if (existingHandler) {
        pathElement.removeEventListener('click', existingHandler);
      }
      
      // Attach new handler
      pathElement.addEventListener('click', domClickHandler, { 
        capture: true,
        passive: false 
      });
      
      // Store reference to handler for cleanup
      (pathElement as any).__clickHandler = domClickHandler;
      
      pathElement.setAttribute('data-click-handler-attached', 'true');
      (pathElement as HTMLElement).style.cursor = 'pointer';
      
      return true;
    };
    
    let pathsFound = 0;
    
    // Try to find paths using multiple strategies
    const strategies = [
      // Strategy 1: Use the layer's _path directly
      () => {
        if ((layer as any)._path) {
          const layerPath = (layer as any)._path;
          if (isElement(layerPath) && attachToPath(layerPath, 'layer._path')) {
            pathsFound++;
            return true;
          }
        }
        return false;
      },
      
      // Strategy 2: Look for paths with the specific drawing ID
      () => {
        const drawingPaths = container.querySelectorAll(`[data-drawing-id="${drawing.id}"]`);
        let found = false;
        drawingPaths.forEach((pathElement) => {
          if (isElement(pathElement) && attachToPath(pathElement, 'data-drawing-id selector')) {
            pathsFound++;
            found = true;
          }
        });
        return found;
      },
      
      // Strategy 3: Look for the most recent interactive path without a handler
      () => {
        const allInteractivePaths = container.querySelectorAll('path.leaflet-interactive');
        const unhandledPaths = Array.from(allInteractivePaths).filter(path => 
          isElement(path) && !path.hasAttribute('data-click-handler-attached')
        );
        
        if (unhandledPaths.length > 0) {
          const targetPath = unhandledPaths[unhandledPaths.length - 1]; // Most recent
          if (isElement(targetPath) && attachToPath(targetPath, 'most-recent-unhandled')) {
            pathsFound++;
            return true;
          }
        }
        return false;
      }
    ];
    
    // Try each strategy until one works
    for (const strategy of strategies) {
      if (strategy()) {
        break;
      }
    }
    
    console.log(`🔍 Total DOM handlers attached: ${pathsFound} for drawing ${drawing.id}`);
    
    if (pathsFound === 0) {
      console.warn(`⚠️ No SVG paths found for drawing ${drawing.id} - handlers may not work`);
      
      // Debug: Log all available paths
      const allPaths = container.querySelectorAll('path');
      console.log(`Debug: ${allPaths.length} total paths in container:`, 
        Array.from(allPaths).map(p => ({
          className: isElement(p) ? p.className : 'unknown',
          'data-drawing-id': isElement(p) ? p.getAttribute('data-drawing-id') : 'unknown',
          hasHandler: isElement(p) ? p.hasAttribute('data-click-handler-attached') : false
        }))
      );
    }
  };
  
  // Try immediate setup
  setupDOMHandlers();
  
  // Also try after delays to catch elements that render later
  setTimeout(() => {
    if (isMounted) {
      setupDOMHandlers();
    }
  }, 100);
  
  setTimeout(() => {
    if (isMounted) {
      setupDOMHandlers();
    }
  }, 500);
  
  // Also try on next animation frame
  requestAnimationFrame(() => {
    if (isMounted) {
      setupDOMHandlers();
    }
  });
  
  console.log(`✅ Layer click handler setup complete for drawing ${drawing.id}`);
};
