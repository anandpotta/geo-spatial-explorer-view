
/**
 * CSS styles for clip mask functionality
 */

// Inject styles for clip mask elements
const clipMaskStyles = `
  .has-image-fill {
    /* Ensure the path remains visible */
    opacity: 1 !important;
    visibility: visible !important;
    display: block !important;
  }
  
  .loading-clip-mask {
    /* Visual indicator while loading */
    opacity: 0.7;
    stroke: #3b82f6;
    stroke-width: 2px;
    stroke-dasharray: 5,5;
    animation: dash 1s linear infinite;
  }
  
  @keyframes dash {
    to {
      stroke-dashoffset: -10;
    }
  }
  
  /* Ensure patterns are properly rendered */
  pattern image {
    opacity: 1;
  }
  
  /* Make sure clipped paths maintain their boundaries */
  path[clip-path] {
    pointer-events: all;
  }
`;

// Inject styles into the document head if not already present
if (typeof document !== 'undefined' && !document.getElementById('clip-mask-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'clip-mask-styles';
  styleElement.textContent = clipMaskStyles;
  document.head.appendChild(styleElement);
}

export { clipMaskStyles };
