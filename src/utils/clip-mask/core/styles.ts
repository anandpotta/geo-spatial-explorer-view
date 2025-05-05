
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
    
    path[fill^="url(#pattern-"] {
      fill-opacity: 1 !important;
    }
    
    /* Make sure pattern fills are visible */
    svg path[fill^="url(#pattern-"] {
      fill-opacity: 1 !important;
      opacity: 1 !important;
    }
    
    /* Ensure SVG patterns render correctly */
    svg pattern {
      patternUnits: userSpaceOnUse !important;
    }
    
    @keyframes dash {
      to {
        stroke-dashoffset: 8;
      }
    }
  `;
  document.head.appendChild(style);
}
