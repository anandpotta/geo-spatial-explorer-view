
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';

/**
 * Sets up click handlers for drawing layers
 */
export const setupLayerClickHandlers = (
  layer: L.Layer,
  drawing: DrawingData,
  isMounted: boolean,
  onRegionClick?: (drawing: DrawingData) => void
): void => {
  if (!layer || !isMounted || !onRegionClick) {
    console.log('Layer click handler setup skipped:', { layer: !!layer, isMounted, onRegionClick: !!onRegionClick });
    return;
  }
  
  console.log(`=== SETTING UP CLICK HANDLER for drawing: ${drawing.id} ===`);
  
  // Enhanced click handler with better event management
  const handleLayerClick = (e: L.LeafletMouseEvent) => {
    console.log(`=== LAYER CLICK HANDLER TRIGGERED ===`);
    console.log(`Drawing layer clicked: ${drawing.id}`);
    console.log('Event details:', { type: e.type, target: e.target });
    
    // Stop event propagation to prevent map click
    if (e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
      e.originalEvent.preventDefault();
      e.originalEvent.stopImmediatePropagation();
    }
    
    // Stop the leaflet event too
    L.DomEvent.stop(e);
    
    if (isMounted && onRegionClick) {
      console.log(`=== CALLING onRegionClick for drawing: ${drawing.id} ===`);
      console.log('Drawing data being passed:', drawing);
      try {
        onRegionClick(drawing);
        console.log(`=== onRegionClick called successfully for drawing: ${drawing.id} ===`);
      } catch (error) {
        console.error(`Error calling onRegionClick for drawing ${drawing.id}:`, error);
      }
    } else {
      console.warn(`Cannot call onRegionClick - isMounted: ${isMounted}, onRegionClick: ${!!onRegionClick}`);
    }
  };
  
  // Set up the click handler on the layer with high priority
  layer.off('click'); // Remove any existing handlers first
  layer.on('click', handleLayerClick);
  console.log(`Main layer click handler attached for drawing: ${drawing.id}`);
  
  // Also set up handlers for sub-layers if this is a feature group
  if (typeof (layer as any).eachLayer === 'function') {
    (layer as any).eachLayer((subLayer: L.Layer) => {
      console.log(`Setting up click handler for sublayer of drawing: ${drawing.id}`);
      
      // Remove any existing handlers
      subLayer.off('click');
      subLayer.on('click', handleLayerClick);
    });
  }
};
