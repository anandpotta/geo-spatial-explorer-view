
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
  if (!layer || !isMounted || !onRegionClick) return;
  
  const currentUser = getCurrentUser();
  if (!currentUser) return; // Don't set up handlers if no user is logged in
  
  // Only set up click handlers for drawings owned by the current user
  if (drawing.userId && drawing.userId !== currentUser.id) {
    console.log(`Drawing ${drawing.id} belongs to another user, skipping handler setup`);
    return;
  }
  
  console.log(`Setting up click handlers for drawing ${drawing.id}`);
  
  // Set up Leaflet layer click handler with higher priority
  layer.on('click', (e: L.LeafletMouseEvent) => {
    console.log(`Layer click detected for drawing ${drawing.id} - preventing map click`);
    
    // Stop event propagation immediately
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      L.DomEvent.stopPropagation(e.originalEvent);
      L.DomEvent.preventDefault(e.originalEvent);
    }
    
    // Stop the leaflet event as well
    L.DomEvent.stopPropagation(e as any);
    L.DomEvent.preventDefault(e as any);
    
    if (isMounted) {
      onRegionClick(drawing);
    }
  });
  
  // Set up DOM event handler for SVG paths with immediate application
  const setupPathClickHandlers = () => {
    if (!isMounted) return;
    
    // Find SVG paths with this drawing ID
    const paths = document.querySelectorAll(`path[data-drawing-id="${drawing.id}"]`);
    console.log(`Found ${paths.length} SVG paths for drawing ${drawing.id}`);
    
    paths.forEach((path) => {
      if (path instanceof SVGPathElement) {
        // Create a DOM event handler specifically for SVG paths
        const handleDOMPathClick = (event: Event) => {
          console.log(`SVG path click detected for drawing ${drawing.id} - preventing map click`);
          
          // Stop all propagation immediately
          event.stopPropagation();
          event.stopImmediatePropagation();
          event.preventDefault();
          
          if (isMounted && onRegionClick) {
            onRegionClick(drawing);
          }
        };
        
        // Remove any existing handlers first
        const existingHandler = (path as any).__clickHandler;
        if (existingHandler) {
          path.removeEventListener('click', existingHandler, true);
          path.removeEventListener('click', existingHandler, false);
        }
        
        // Add new click handler with capture=true for higher priority
        path.addEventListener('click', handleDOMPathClick, true);
        
        // Also add a non-capturing handler as fallback
        path.addEventListener('click', handleDOMPathClick, false);
        
        // Ensure the path is properly set up for clicking
        path.style.pointerEvents = 'auto';
        path.style.cursor = 'pointer';
        
        // Store the handler function for potential cleanup
        (path as any).__clickHandler = handleDOMPathClick;
      }
    });
  };
  
  // Set up path handlers immediately and with delays
  setupPathClickHandlers();
  setTimeout(setupPathClickHandlers, 100);
  setTimeout(setupPathClickHandlers, 500);
};
