
/**
 * Utilities for checking if SVG elements have clip masks
 */

/**
 * Checks if a path element already has a clip mask applied
 */
export const hasClipMaskApplied = (svgPath: SVGPathElement): boolean => {
  // Check for data attribute flag (most reliable)
  if (svgPath.getAttribute('data-has-clip-mask') === 'true') {
    return true;
  }
  
  // Check for clip-path attribute or style
  const clipPathAttr = svgPath.getAttribute('clip-path');
  const clipPathStyle = svgPath.style.clipPath;
  
  if ((clipPathAttr && clipPathAttr.startsWith('url(#clip-')) ||
      (clipPathStyle && clipPathStyle.startsWith('url(#clip-'))) {
    return true;
  }
  
  // Check for fill pattern
  const fillAttr = svgPath.getAttribute('fill');
  const fillStyle = svgPath.style.fill;
  
  if ((fillAttr && fillAttr.startsWith('url(#pattern-')) ||
      (fillStyle && fillStyle.startsWith('url(#pattern-'))) {
    return true;
  }
  
  // Check parent SVG for matching defs
  const svg = svgPath.closest('svg');
  if (svg) {
    const drawingId = svgPath.getAttribute('data-drawing-id');
    if (drawingId) {
      const defs = svg.querySelector('defs');
      if (defs) {
        const pattern = defs.querySelector(`#pattern-${drawingId}`);
        const clipPath = defs.querySelector(`#clip-${drawingId}`);
        if (pattern || clipPath) {
          // If we found matching defs, update the flag attribute for future checks
          svgPath.setAttribute('data-has-clip-mask', 'true');
          return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * More thorough check for clip mask, looking at document level
 * This is used when the path might have been replaced in the DOM
 */
export const hasClipMaskInDocument = (drawingId: string): boolean => {
  // Try to find the pattern in any defs in the document
  const patterns = document.querySelectorAll(`defs #pattern-${drawingId}`);
  const clipPaths = document.querySelectorAll(`defs #clip-${drawingId}`);
  
  return patterns.length > 0 || clipPaths.length > 0;
};
