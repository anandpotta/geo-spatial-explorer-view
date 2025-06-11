
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
      L.DomEvent.stopPropagation(e.originalEvent);
      e.originalEvent.preventDefault();
    }
    
    // Stop the leaflet event too
    L.DomEvent.stop(e);
    
    // Check if this is a request to upload an image (right-click or ctrl+click)
    const isUploadRequest = e.originalEvent && (
      (e.originalEvent as MouseEvent).ctrlKey || 
      (e.originalEvent as MouseEvent).button === 2 || // right click
      (e.originalEvent as MouseEvent).metaKey // cmd on mac
    );
    
    if (isUploadRequest && onUploadRequest) {
      console.log(`Upload request for drawing: ${drawing.id}`);
      onUploadRequest(drawing.id);
      return;
    }
    
    if (isMounted && onRegionClick) {
      console.log(`Calling onRegionClick for drawing: ${drawing.id}`);
      onRegionClick(drawing);
    }
  };
  
  // Enhanced context menu handler
  const handleContextMenu = (e: L.LeafletMouseEvent) => {
    console.log(`Context menu triggered for drawing: ${drawing.id}`, e);
    
    if (e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
      e.originalEvent.preventDefault();
    }
    L.DomEvent.stop(e);
    
    if (onUploadRequest) {
      console.log(`Context menu upload request for drawing: ${drawing.id}`);
      onUploadRequest(drawing.id);
    }
  };
  
  // Set up the click handlers
  layer.on('click', handleLayerClick);
  layer.on('contextmenu', handleContextMenu);
  
  // Also set up handlers for sub-layers if this is a feature group
  if (typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((subLayer: L.Layer) => {
      subLayer.on('click', handleLayerClick);
      subLayer.on('contextmenu', handleContextMenu);
      
      // Make sure the sublayer is interactive
      if ((subLayer as any).setStyle) {
        (subLayer as any).setStyle({
          interactive: true,
          bubblingMouseEvents: false
        });
      }
    });
  }
  
  console.log(`Click handlers set up for drawing: ${drawing.id}`);
};
