
/**
 * Utilities for checking if elements have clip masks applied
 */

/**
 * Check if a path element already has a clip mask applied
 */
export const hasClipMaskApplied = (pathElement: SVGPathElement): boolean => {
  // More reliable check using multiple indicators
  const hasDataAttribute = pathElement.hasAttribute('data-has-clip-mask');
  const hasClipPath = pathElement.hasAttribute('clip-path') || pathElement.style.clipPath;
  const hasFillPattern = (pathElement.getAttribute('fill')?.includes('url(#pattern-') || 
                          pathElement.style.fill?.includes('url(#pattern-'));
  
  // Debug info
  if (hasDataAttribute || hasClipPath || hasFillPattern) {
    console.log('Clip mask check:', { 
      hasDataAttribute, 
      hasClipPath, 
      hasFillPattern,
      clipPath: pathElement.getAttribute('clip-path') || pathElement.style.clipPath,
      fill: pathElement.getAttribute('fill') || pathElement.style.fill
    });
  }
  
  // Return true if any of the indicators suggest a clip mask is present
  return hasDataAttribute || (hasClipPath && hasFillPattern);
};
