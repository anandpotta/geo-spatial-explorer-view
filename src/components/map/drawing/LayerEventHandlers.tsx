
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
  onRegionClick?: (drawing: DrawingData) => void,
  onUploadRequest?: (drawingId: string) => void
): void => {
  if (!layer || !isMounted) return;
  
  const currentUser = getCurrentUser();
  if (!currentUser) return; // Don't set up handlers if no user is logged in
  
  // Only set up click handlers for drawings owned by the current user
  if (drawing.userId && drawing.userId !== currentUser.id) {
    console.log(`Drawing ${drawing.id} belongs to another user, skipping handler setup`);
    return;
  }
  
  // Enhanced click handler with better event management
  const handleLayerClick = (e: L.LeafletMouseEvent) => {
    console.log(`Drawing layer clicked: ${drawing.id}`, e);
    
    // Stop event propagation to prevent map click
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
    
    // Stop the leaflet event too
    L.DomEvent.stop(e);
    
    // Always trigger upload request on any click
    if (isMounted && onUploadRequest) {
      console.log(`Triggering upload request for drawing: ${drawing.id}`);
      onUploadRequest(drawing.id);
    } else if (isMounted && onRegionClick) {
      console.log(`Calling onRegionClick for drawing: ${drawing.id}`);
      onRegionClick(drawing);
    }
  };
  
  // Enhanced context menu handler
  const handleContextMenu = (e: L.LeafletMouseEvent) => {
    console.log(`Context menu triggered for drawing: ${drawing.id}`, e);
    
    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    }
    L.DomEvent.stop(e);
    
    if (onUploadRequest) {
      console.log(`Context menu upload request for drawing: ${drawing.id}`);
      onUploadRequest(drawing.id);
    }
  };
  
  // Remove any existing handlers first to prevent duplicates
  layer.off('click');
  layer.off('contextmenu');
  
  // Set up the click handlers
  layer.on('click', handleLayerClick);
  layer.on('contextmenu', handleContextMenu);
  
  // Also set up handlers for sub-layers if this is a feature group
  if (typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((subLayer: L.Layer) => {
      // Remove existing handlers
      subLayer.off('click');
      subLayer.off('contextmenu');
      
      // Add new handlers
      subLayer.on('click', handleLayerClick);
      subLayer.on('contextmenu', handleContextMenu);
      
      // Make sure the sublayer is interactive and has proper styling
      if ('setStyle' in subLayer && typeof (subLayer as any).setStyle === 'function') {
        (subLayer as any).setStyle({
          interactive: true,
          bubblingMouseEvents: false,
          pane: 'overlayPane'
        });
      }
      
      // Ensure the element has pointer events enabled
      if ((subLayer as any)._path) {
        (subLayer as any)._path.style.pointerEvents = 'all';
        (subLayer as any)._path.style.cursor = 'pointer';
      }
    });
  }
  
  // Ensure the main layer element has pointer events enabled
  if ((layer as any)._path) {
    (layer as any)._path.style.pointerEvents = 'all';
    (layer as any)._path.style.cursor = 'pointer';
  }
  
  console.log(`Enhanced click handlers set up for drawing: ${drawing.id}`);
};
