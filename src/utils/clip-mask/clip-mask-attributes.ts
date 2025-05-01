
/**
 * Utilities for managing SVG element attributes related to clip masks
 */

/**
 * Store original attributes on an SVG path element for potential restoration
 */
export const storeOriginalAttributes = (pathElement: SVGPathElement): void => {
  const pathData = pathElement.getAttribute('d');
  if (!pathData) return;
  
  pathElement.setAttribute('data-original-d', pathData);
  pathElement.setAttribute('data-original-fill', pathElement.getAttribute('fill') || '');
  pathElement.setAttribute('data-original-stroke', pathElement.getAttribute('stroke') || '');
};

/**
 * Remove clip-mask related attributes from an SVG path
 */
export const removeClipMaskAttributes = (svgPath: SVGPathElement): void => {
  svgPath.removeAttribute('data-has-clip-mask');
  svgPath.removeAttribute('data-image-url');
  svgPath.removeAttribute('data-image-rotation');
  svgPath.removeAttribute('data-image-scale');
  svgPath.removeAttribute('data-image-offset-x');
  svgPath.removeAttribute('data-image-offset-y');
  svgPath.removeAttribute('data-last-updated');
};

/**
 * Restore original attributes from stored data attributes
 */
export const restoreOriginalAttributes = (svgPath: SVGPathElement): void => {
  // Restore original fill and stroke
  const originalFill = svgPath.getAttribute('data-original-fill');
  if (originalFill) {
    svgPath.setAttribute('fill', originalFill);
  } else {
    svgPath.removeAttribute('fill');
  }
  
  const originalStroke = svgPath.getAttribute('data-original-stroke');
  if (originalStroke) {
    svgPath.setAttribute('stroke', originalStroke);
  } else {
    svgPath.removeAttribute('stroke');
  }
};
