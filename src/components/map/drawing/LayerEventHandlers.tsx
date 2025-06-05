
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
  if (!currentUser) return;
  
  // Only set up click handlers for drawings owned by the current user
  if (drawing.userId && drawing.userId !== currentUser.id) {
    console.log(`Drawing ${drawing.id} belongs to another user, skipping handler setup`);
    return;
  }
  
  // Remove any existing click handlers
  layer.off('click');
  
  layer.on('click', (e) => {
    console.log('Layer clicked:', drawing.id);
    
    // Stop event propagation to prevent map click
    if (e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
      e.originalEvent.preventDefault();
    }
    
    // Prevent the event from bubbling up
    L.DomEvent.stop(e);
    
    if (isMounted && onRegionClick) {
      console.log('Calling onRegionClick for drawing:', drawing.id);
      onRegionClick(drawing);
    }
  });
  
  // Also set up mouse events for better interaction
  layer.on('mouseover', () => {
    if (layer instanceof L.Path) {
      layer.setStyle({ 
        weight: 5,
        opacity: 0.8,
        fillOpacity: 0.3
      });
    }
  });
  
  layer.on('mouseout', () => {
    if (layer instanceof L.Path) {
      layer.setStyle({ 
        weight: 3,
        opacity: 0.6,
        fillOpacity: 0.2
      });
    }
  });
};
