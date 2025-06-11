
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
  
  // Set up Leaflet layer click handler
  layer.on('click', (e) => {
    console.log(`Layer click detected for drawing ${drawing.id}`);
    
    // Stop event propagation to prevent map click
    if (e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
    }
    
    if (isMounted) {
      onRegionClick(drawing);
    }
  });
  
  // Also set up DOM event handler for SVG paths
  setTimeout(() => {
    if (!isMounted) return;
    
    // Find SVG paths with this drawing ID
    const paths = document.querySelectorAll(`path[data-drawing-id="${drawing.id}"]`);
    console.log(`Found ${paths.length} SVG paths for drawing ${drawing.id}`);
    
    paths.forEach((path) => {
      if (path instanceof SVGPathElement) {
        // Remove any existing click handlers to avoid duplicates
        path.removeEventListener('click', handlePathClick);
        
        // Add new click handler
        path.addEventListener('click', handlePathClick);
        
        function handlePathClick(event: Event) {
          console.log(`SVG path click detected for drawing ${drawing.id}`);
          
          // Stop propagation to prevent map click
          event.stopPropagation();
          event.preventDefault();
          
          if (isMounted && onRegionClick) {
            onRegionClick(drawing);
          }
        }
      }
    });
  }, 500);
};
