
/**
 * Utilities for checking if clip masks are applied to SVG elements
 */

/**
 * Checks if an SVG path element has a clip mask applied
 */
export const hasClipMaskApplied = (svgPath: SVGPathElement): boolean => {
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
  
  return false;
};
