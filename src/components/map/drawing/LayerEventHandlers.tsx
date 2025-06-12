
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
    console.log(`🎯 Drawing ${drawing.id} click handler triggered - SUCCESS!`);
    
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
  
  // Enhanced DOM-level click handlers with better timing and element detection
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
    
    // First, try to set the data attribute on the layer's DOM element
    if ((layer as any)._path) {
      const pathElement = (layer as any)._path;
      pathElement.setAttribute('data-drawing-id', drawing.id);
      console.log(`✅ Set data-drawing-id on layer path for ${drawing.id}`);
    }
    
    // Enhanced selectors - try multiple approaches to find the path
    const selectors = [
      `[data-drawing-id="${drawing.id}"]`,
      `path[data-drawing-id="${drawing.id}"]`,
      `.leaflet-interactive[data-drawing-id="${drawing.id}"]`,
      '.leaflet-interactive', // Fallback to all interactive elements
      'path.leaflet-interactive' // All interactive paths
    ];
    
    let pathsFound = 0;
    let handledPaths = new Set();
    
    // Function to attach handler to a path element
    const attachToPath = (pathElement: Element, source: string) => {
      if (!pathElement || handledPaths.has(pathElement)) {
        return false;
      }
      
      // Set the data attribute if not present
      if (!pathElement.getAttribute('data-drawing-id')) {
        pathElement.setAttribute('data-drawing-id', drawing.id);
      }
      
      console.log(`🎯 Attaching DOM click handler to path from ${source} for drawing ${drawing.id}`);
      
      const domClickHandler = (event: Event) => {
        console.log(`🚀 DOM click handler triggered for drawing ${drawing.id} - SUCCESS!`);
        
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
      
      pathElement.addEventListener('click', domClickHandler, { 
        capture: true,
        passive: false 
      });
      
      (pathElement as any).setAttribute('data-click-handler-attached', 'true');
      (pathElement as any).style.cursor = 'pointer';
      
      handledPaths.add(pathElement);
      return true;
    };
    
    // Try specific selectors first
    selectors.slice(0, 3).forEach(selector => {
      const drawingPaths = container.querySelectorAll(selector);
      console.log(`Found ${drawingPaths.length} paths with selector "${selector}" for drawing ${drawing.id}`);
      
      drawingPaths.forEach((pathElement) => {
        if (attachToPath(pathElement, `selector: ${selector}`)) {
          pathsFound++;
        }
      });
    });
    
    // If no specific paths found, try to match by layer reference
    if (pathsFound === 0 && (layer as any)._path) {
      const layerPath = (layer as any)._path;
      if (attachToPath(layerPath, 'layer._path')) {
        pathsFound++;
      }
    }
    
    // If still no paths found, try all interactive paths and match by proximity or other heuristics
    if (pathsFound === 0) {
      const allInteractivePaths = container.querySelectorAll('path.leaflet-interactive');
      console.log(`Fallback: Found ${allInteractivePaths.length} interactive paths total`);
      
      // For now, attach to the most recently added interactive path that doesn't have a handler
      const unhandledPaths = Array.from(allInteractivePaths).filter(path => 
        !path.hasAttribute('data-click-handler-attached')
      );
      
      if (unhandledPaths.length > 0) {
        const targetPath = unhandledPaths[unhandledPaths.length - 1]; // Most recent
        if (attachToPath(targetPath, 'fallback-recent')) {
          pathsFound++;
        }
      }
    }
    
    console.log(`🔍 Total DOM handlers attached: ${pathsFound} for drawing ${drawing.id}`);
    
    if (pathsFound === 0) {
      console.warn(`⚠️ No SVG paths found for drawing ${drawing.id} - handlers may not work`);
      
      // Debug: Log all available paths
      const allPaths = container.querySelectorAll('path');
      console.log(`Debug: ${allPaths.length} total paths in container:`, 
        Array.from(allPaths).map(p => ({
          className: p.className,
          'data-drawing-id': p.getAttribute('data-drawing-id'),
          hasHandler: p.hasAttribute('data-click-handler-attached')
        }))
      );
    }
  };
  
  // Try immediate setup and also delayed setup
  setupDOMHandlers();
  
  // Also try after a longer delay to catch late-rendered elements
  setTimeout(setupDOMHandlers, 500);
  
  console.log(`✅ Layer click handler setup complete for drawing ${drawing.id}`);
};
