
import { useEffect } from 'react';

/**
 * Hook to enhance rendering styles for drawing elements
 */
export function useDrawingStyleEnhancer(mapContainer: HTMLElement | null) {
  useEffect(() => {
    if (!mapContainer) return;
    
    // Apply additional anti-flickering CSS to the map container
    mapContainer.classList.add('optimize-svg-rendering');
    
    // Add a style element with our anti-flicker and improved polygon drawing CSS
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
        pointer-events: auto !important;
      }
      
      /* Force SVG rendering for all draw shapes */
      .leaflet-draw-draw-polygon,
      .leaflet-draw-draw-rectangle,
      .leaflet-draw-draw-circle {
        pointer-events: auto !important;
      }
      
      /* Ensure path elements are visible */
      .leaflet-overlay-pane path,
      .leaflet-draw-item path {
        fill-opacity: 0.6 !important;
        stroke-width: 4px !important;
        stroke-opacity: 1 !important;
        pointer-events: auto !important;
      }
      
      /* Improve polygon vertex visibility */
      .leaflet-draw-tooltip {
        background: #333;
        color: #fff;
        border: 1px solid #000;
        border-radius: 4px;
        padding: 4px 8px;
        pointer-events: none;
        opacity: 1;
        font-weight: bold;
        white-space: nowrap;
        box-shadow: 0 1px 7px rgba(0,0,0,0.4);
        z-index: 9999 !important;
      }
      
      /* Make drawing guides more visible */
      .leaflet-draw-guide-dash {
        opacity: 1 !important;
        stroke-width: 2px !important;
        stroke: #33C3F0 !important;
      }
      
      /* Make draw markers more visible */
      .leaflet-marker-icon.leaflet-div-icon.leaflet-editing-icon {
        border: 2px solid #33C3F0;
        background-color: white;
        border-radius: 50%;
        width: 10px !important;
        height: 10px !important;
        margin-left: -5px !important;
        margin-top: -5px !important;
      }
      
      /* Critical fix for the polygon drawing lines */
      .leaflet-editing-icon {
        z-index: 1000 !important;
        pointer-events: auto !important;
      }
      
      /* Ensure polyline segments are visible */
      .leaflet-draw-guide-dash {
        stroke: #33C3F0 !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
        stroke-dasharray: 5, 5;
        pointer-events: none;
      }
      
      /* Fix for polygon drawing - ensure vertices connect properly */
      .leaflet-draw-polyline-guide {
        stroke: #33C3F0 !important;
        stroke-width: 2px !important;
        stroke-opacity: 1 !important;
        pointer-events: none;
      }
      
      /* Ensure polygon guide lines are visible */
      .leaflet-zoom-animated path {
        stroke-opacity: 1 !important;
      }
      
      /* Make polygon vertices more visible */
      .leaflet-draw-actions a {
        background-color: #333 !important;
        color: #fff !important;
      }
      
      /* Fix for polygon vertex markers */
      .leaflet-vertex-icon {
        border: 2px solid #33C3F0 !important;
        background-color: white !important;
        border-radius: 50% !important;
        width: 10px !important;
        height: 10px !important;
      }
      
      /* Make interactive markers easier to click */
      .leaflet-marker-pane {
        z-index: 1000 !important;
        pointer-events: auto !important;
      }
      
      /* Fix polygon markers specifically */
      .leaflet-marker-pane .leaflet-marker-icon {
        z-index: 1000 !important;
        pointer-events: auto !important;
        cursor: pointer !important;
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
        fill-opacity: 0.7 !important;
        vector-effect: non-scaling-stroke;
      }
      .leaflet-overlay-pane path.leaflet-interactive {
        stroke-width: 4px !important;
        stroke-opacity: 1 !important;
        pointer-events: auto !important;
        cursor: pointer !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    // Force the browser to acknowledge these changes
    mapContainer.getBoundingClientRect();
    
    // Force a reflow to ensure styles are applied
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    
    // Cleanup function
    return () => {
      // Remove the style element
      document.head.removeChild(styleEl);
      
      // Remove the class from map container
      mapContainer.classList.remove('optimize-svg-rendering');
    };
  }, [mapContainer]);
}
