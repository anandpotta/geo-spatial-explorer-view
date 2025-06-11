
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
  
  // Allow anonymous users to interact with drawings, but only allow interaction with their own drawings
  // For anonymous users, we'll use 'anonymous' as the userId
  const effectiveUserId = currentUser?.id || 'anonymous';
  
  // Only set up click handlers for drawings owned by the current user (including anonymous)
  if (drawing.userId && drawing.userId !== effectiveUserId) {
    console.log(`Drawing ${drawing.id} belongs to another user, skipping handler setup`);
    return;
  }
  
  // Enhanced click handler with better event management
  const handleLayerClick = (e: L.LeafletMouseEvent) => {
    console.log(`Drawing layer clicked: ${drawing.id}`);
    
    // Stop event propagation to prevent map click
    if (e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
      e.originalEvent.preventDefault();
    }
    
    // Stop the leaflet event too
    L.DomEvent.stop(e);
    
    if (isMounted && onRegionClick) {
      console.log(`Calling onRegionClick for drawing: ${drawing.id}, drawing data:`, drawing);
      onRegionClick(drawing);
    }
  };
  
  // Set up the click handler
  layer.on('click', handleLayerClick);
  
  // Also set up handlers for sub-layers if this is a feature group
  if (typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((subLayer: L.Layer) => {
      subLayer.on('click', handleLayerClick);
    });
  }
  
  console.log(`Click handler set up for drawing: ${drawing.id}, onRegionClick is:`, !!onRegionClick);
};
