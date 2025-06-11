
/**
 * Utilities for checking if clip masks are applied to SVG elements
 */

/**
 * Checks if an SVG path element has a clip mask applied
 */
export const hasClipMaskApplied = (svgPath: SVGPathElement): boolean => {
  if (!svgPath) return false;
  
  // Check for data attribute first (most reliable)
  if (svgPath.getAttribute('data-has-clip-mask') === 'true') {
    return true;
  }
  
  // Check for fill attribute with pattern
  const fillAttr = svgPath.getAttribute('fill');
  if (fillAttr && fillAttr.includes('url(#pattern-')) {
    return true;
  }
  
  // Check for style.fill with pattern
  if (svgPath.style.fill && svgPath.style.fill.includes('url(#pattern-')) {
    return true;
  }
  
  // Check for class that indicates image fill
  if (svgPath.classList.contains('has-image-fill')) {
    return true;
  }
  
  // Check for clip-path attribute
  const clipPathAttr = svgPath.getAttribute('clip-path');
  if (clipPathAttr && clipPathAttr.includes('url(#clip-')) {
    return true;
  }
  
  // Check for parent containing a pattern with this path's ID
  try {
    const svg = svgPath.closest('svg');
    if (svg) {
      const drawingId = svgPath.getAttribute('data-drawing-id');
      if (drawingId) {
        const pattern = svg.querySelector(`pattern[id^="pattern-${drawingId}"]`);
        if (pattern) {
          return true;
        }
      }
    }
  } catch (e) {
    console.warn('Error checking for pattern in SVG:', e);
  }
  
  return false;
};

/**
 * Checks if an image exists in the clip mask pattern
 */
export const hasImageInClipMask = (svgPath: SVGPathElement): boolean => {
  if (!svgPath) return false;
  
  try {
    const svg = svgPath.closest('svg');
    if (!svg) return false;
    
    const drawingId = svgPath.getAttribute('data-drawing-id');
    if (!drawingId) return false;
    
    const patternId = `pattern-${drawingId}`;
    const pattern = svg.querySelector(`#${patternId}`);
    
    if (pattern) {
      const image = pattern.querySelector('image');
      return !!image;
    }
  } catch (e) {
    console.warn('Error checking for image in clip mask:', e);
  }
  
  return false;
};
