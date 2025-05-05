
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
  
  // Preserve SVG path data if available
  if ('_path' in layer && layer._path) {
    // Add class for consistent path styling
    layer._path.classList.add('visible-path-stroke');
    
    // Store the original path data to prevent SVG path disappearance
    if (drawing.svgPath && layer._path.getAttribute('d') !== drawing.svgPath) {
      try {
        layer._path.setAttribute('d', drawing.svgPath);
        
        // Force a reflow to ensure the path is displayed
        layer._path.getBoundingClientRect();
      } catch (err) {
        console.error('Error setting path data:', err);
      }
    }
  }
};

