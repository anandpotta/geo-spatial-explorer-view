
/**
 * Styles for clip mask elements
 */

// Add global styles for clip mask elements
if (typeof document !== 'undefined') {
  // Add styles to document
  const style = document.createElement('style');
  style.innerHTML = `
    .visible-path-stroke {
      stroke-width: 4px !important;
      stroke: #33C3F0 !important;
      stroke-opacity: 1 !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
      fill-opacity: 1 !important;
      vector-effect: non-scaling-stroke;
      pointer-events: auto !important;
    }
    
    .loading-clip-mask {
      stroke-dasharray: 4 !important;
      animation: dash 1.5s linear infinite !important;
    }
    
    .has-image-fill {
      fill-opacity: 1 !important;
    }
    
    path[data-has-clip-mask="true"] {
      fill-opacity: 1 !important;
    }
    
    /* Make sure pattern fills are visible with stronger enforcement */
    path[fill^="url(#pattern-"] {
      fill-opacity: 1 !important;
      opacity: 1 !important;
    }
    
    /* Force SVG patterns to be visible */
    svg defs pattern {
      patternUnits: userSpaceOnUse !important;
    }
    
    /* Ensure SVG pattern images are fully visible */
    svg defs pattern image {
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    /* Set default fill-opacity for all SVG paths */
    svg path:not([data-has-clip-mask="true"]):not([fill^="url(#pattern-"]):not(.visible-path-stroke):not(.has-image-fill) {
      fill-opacity: 0.6 !important;
    }
    
    /* Ensure all draw shapes use SVG path */
    .leaflet-draw-draw-polygon,
    .leaflet-draw-draw-rectangle,
    .leaflet-draw-draw-circle {
      pointer-events: auto !important;
    }

    /* Fix specific rectangle drawing issues */
    .leaflet-rectangle-editing path.leaflet-interactive,
    .leaflet-draw-draw-rectangle + path.leaflet-interactive,
    .leaflet-editing-rectangle {
      stroke-width: 4px !important;
      stroke: #33C3F0 !important;
      stroke-opacity: 1 !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
      vector-effect: non-scaling-stroke;
      pointer-events: auto !important;
      fill-opacity: 0.6 !important;
    }
    
    .leaflet-draw-tooltip {
      background: rgba(0, 0, 0, 0.7) !important;
      color: white !important;
      border: 1px solid #33C3F0 !important;
      pointer-events: none !important;
    }
    
    @keyframes dash {
      to {
        stroke-dashoffset: 8;
      }
    }
  `;
  document.head.appendChild(style);
}
