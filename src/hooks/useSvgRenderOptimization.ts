
import { useEffect } from 'react';
import L from 'leaflet';
import { configureSvgRenderer, optimizePolygonDrawing, enhancePathPreservation } from '@/utils/draw-tools-utils';

/**
 * Hook to optimize SVG rendering and prevent flickering
 * @param map The Leaflet map instance
 * @returns Cleanup function
 */
export function useSvgRenderOptimization(map: L.Map | null | undefined) {
  useEffect(() => {
    if (!map) return;
    
    // Set up SVG renderer configuration to reduce flickering
    const cleanupSvgRenderer = configureSvgRenderer();
    
    // Optimize polygon drawing specifically
    const originalOnMarkerDrag = optimizePolygonDrawing();
    
    // Set up path preservation
    const cleanupPathPreservation = enhancePathPreservation(map);
    
    // Apply additional anti-flickering CSS to the map container
    const mapContainer = map.getContainer();
    if (mapContainer) {
      mapContainer.classList.add('optimize-svg-rendering');
      
      // Add a style element with our anti-flicker CSS
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        .optimize-svg-rendering .leaflet-overlay-pane svg {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
        .leaflet-drawing {
          stroke-linecap: round;
          stroke-linejoin: round;
          vector-effect: non-scaling-stroke;
        }
        .leaflet-interactive {
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        .image-controls-wrapper {
          opacity: 1 !important;
          transition: opacity 0.2s ease-in-out;
          z-index: 1000 !important;
          pointer-events: auto !important;
        }
        .persistent-control {
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
        }
        .visible-path-stroke {
          stroke-width: 4px !important;
          stroke: #33C3F0 !important;
          stroke-opacity: 1 !important;
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
          fill-opacity: 0.3 !important;
          vector-effect: non-scaling-stroke;
        }
        .leaflet-overlay-pane path.leaflet-interactive {
          stroke-width: 4px !important;
          stroke-opacity: 1 !important;
        }
      `;
      document.head.appendChild(styleEl);
      
      // Force a reflow to ensure the browser acknowledges these changes
      mapContainer.getBoundingClientRect();
    }
    
    // Cleanup function
    return () => {
      cleanupSvgRenderer();
      cleanupPathPreservation();
      
      // Restore original marker drag handler if it was modified
      if (originalOnMarkerDrag && L.Edit && (L.Edit as any).Poly) {
        (L.Edit as any).Poly.prototype._onMarkerDrag = originalOnMarkerDrag;
      }
      
      // Remove the style element
      const styles = document.querySelectorAll('style');
      styles.forEach(style => {
        if (style.innerHTML.includes('optimize-svg-rendering')) {
          document.head.removeChild(style);
        }
      });
      
      // Remove the class from map container
      if (mapContainer) {
        mapContainer.classList.remove('optimize-svg-rendering');
      }
    };
  }, [map]);
}
