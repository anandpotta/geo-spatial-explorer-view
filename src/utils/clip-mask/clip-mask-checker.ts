
/**
 * Utilities for checking clip mask state on SVG elements
 */
import { SVGPathElementWithAttributes } from '../svg-types';

/**
 * Checks if a path element already has a clip mask applied
 */
export const hasClipMaskApplied = (svgPath: SVGPathElement | null): boolean => {
  if (!svgPath) return false;
  
  // Check for definitive clip mask attribute
  if (svgPath.getAttribute('data-has-clip-mask') === 'true') {
    return true;
  }
  
  // Second check: verify if it has clip-path attribute
  if (svgPath.hasAttribute('clip-path')) {
    return true;
  }
  
  // Third check: check if pattern fill is applied
  const fill = svgPath.getAttribute('fill');
  if (fill && fill.includes('url(#pattern-')) {
    return true;
  }
  
  return false;
};
