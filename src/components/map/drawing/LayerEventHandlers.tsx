
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
  if (!layer || !isMounted || !onRegionClick) return;
  
  layer.on('click', (e) => {
    // Stop event propagation to prevent map click
    if (e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
    }
    
    if (isMounted) {
      onRegionClick(drawing);
    }
  });
};

/**
 * Sets up all event handlers for layers
 */
export const setupLayerEvents = (
  layer: L.Layer, 
  drawing: DrawingData, 
  onRegionClick?: (drawing: DrawingData) => void
): void => {
  if (!layer || !onRegionClick) return;
  
  // Set up click handler
  layer.on('click', (e) => {
    // Stop event propagation to prevent map click
    if (e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
    }
    
    onRegionClick(drawing);
  });
};
