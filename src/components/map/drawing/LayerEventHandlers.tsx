
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
  // Critical conditional checks that were missing
  if (!layer) {
    console.warn('Layer is null or undefined, cannot setup click handlers');
    return;
  }
  
  if (!isMounted) {
    console.warn('Component not mounted, skipping handler setup');
    return;
  }
  
  if (!onRegionClick) {
    console.warn('No onRegionClick callback provided, skipping handler setup');
    return;
  }
  
  if (!drawing || !drawing.id) {
    console.warn('Invalid drawing data, skipping handler setup');
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
  
  // Remove any existing handlers first
  if (layer.off && typeof layer.off === 'function') {
    layer.off('click');
  }
  
  // Create the click handler
  const handleLayerClick = (e: L.LeafletMouseEvent) => {
    console.log(`🎯 Layer click handler triggered for drawing ${drawing.id}`);
    
    // Stop event propagation immediately
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      (e.originalEvent as any).__handledByLayer = true;
    }
    
    // Stop Leaflet event propagation
    L.DomEvent.stop(e);
    
    // Ensure component is still mounted before calling callback
    if (isMounted && onRegionClick) {
      console.log(`✅ Calling onRegionClick for drawing ${drawing.id}`);
      onRegionClick(drawing);
    }
    
    return false;
  };
  
  // Attach handler to the main layer if it has the 'on' method
  if (layer.on && typeof layer.on === 'function') {
    layer.on('click', handleLayerClick);
    console.log(`✅ Main layer click handler attached for drawing ${drawing.id}`);
  }
  
  // Handle feature groups and layer groups with child layers
  if (layer && typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((childLayer: L.Layer) => {
      if (childLayer && childLayer.on && typeof childLayer.on === 'function') {
        // Remove existing handlers on child layer
        if (childLayer.off && typeof childLayer.off === 'function') {
          childLayer.off('click');
        }
        // Attach new handler
        childLayer.on('click', handleLayerClick);
        console.log(`✅ Child layer click handler attached for drawing ${drawing.id}`);
      }
    });
  }
  
  // Additional check: Set up DOM-level handlers for SVG paths
  // This is crucial for cases where Leaflet handlers don't work
  setTimeout(() => {
    if (!isMounted) return;
    
    const map = (layer as any)._map;
    if (!map || !map.getContainer) {
      console.warn('Map not available for DOM handler setup');
      return;
    }
    
    const container = map.getContainer();
    if (!container) {
      console.warn('Map container not available for DOM handler setup');
      return;
    }
    
    // Find all SVG paths for this drawing
    const paths = container.querySelectorAll(`[data-drawing-id="${drawing.id}"]`);
    const interactivePaths = container.querySelectorAll('.leaflet-interactive');
    
    const allPaths = [...Array.from(paths), ...Array.from(interactivePaths)];
    
    allPaths.forEach((pathElement: any) => {
      if (!pathElement) return;
      
      // Skip if already has handler
      if (pathElement.hasAttribute('data-click-handler-attached')) {
        return;
      }
      
      console.log(`🎯 Attaching DOM click handler to path for drawing ${drawing.id}`);
      
      const domClickHandler = (event: Event) => {
        console.log(`🚀 DOM click handler triggered for drawing ${drawing.id}`);
        
        // Mark as handled
        (event as any).__handledByLayer = true;
        
        event.stopPropagation();
        event.preventDefault();
        
        // Ensure component is still mounted
        if (isMounted && onRegionClick) {
          onRegionClick(drawing);
        }
      };
      
      pathElement.addEventListener('click', domClickHandler, { 
        capture: true,
        passive: false 
      });
      pathElement.setAttribute('data-click-handler-attached', 'true');
      pathElement.setAttribute('data-drawing-id', drawing.id);
      pathElement.style.cursor = 'pointer';
    });
  }, 100);
  
  console.log(`✅ Layer click handler setup complete for drawing ${drawing.id}`);
};
