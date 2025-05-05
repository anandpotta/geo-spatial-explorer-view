
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { SVGPathElementWithAttributes } from '@/utils/svg-types';

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
    // Ensure we work with the path element with proper typing
    const pathElement = layer._path as SVGPathElement;
    
    // Add class for consistent path styling
    pathElement.classList.add('visible-path-stroke');
    
    // Store the original path data to prevent SVG path disappearance
    if (drawing.svgPath && pathElement.getAttribute('d') !== drawing.svgPath) {
      try {
        pathElement.setAttribute('d', drawing.svgPath);
        
        // Also store as data attribute for easier recovery
        pathElement.setAttribute('data-original-path', drawing.svgPath);
        
        // Force a reflow to ensure the path is displayed
        pathElement.getBoundingClientRect();
      } catch (err) {
        console.error('Error setting path data:', err);
      }
    }
    
    // Set up a MutationObserver to watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'd') {
          const currentPath = pathElement.getAttribute('d');
          const originalPath = pathElement.getAttribute('data-original-path');
          
          // If the path changed and we have the original, restore it
          if (originalPath && currentPath !== originalPath) {
            pathElement.setAttribute('d', originalPath);
          }
          
          // Ensure visibility
          if (!pathElement.classList.contains('visible-path-stroke')) {
            pathElement.classList.add('visible-path-stroke');
          }
        }
      });
    });
    
    // Start observing the path element
    observer.observe(pathElement, {
      attributes: true,
      attributeFilter: ['d', 'class', 'style']
    });
    
    // Add event listener to layer events that might affect visibility
    layer.on('remove', () => observer.disconnect());
  }
};
