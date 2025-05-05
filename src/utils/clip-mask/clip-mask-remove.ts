
/**
 * Functionality for removing clip masks from SVG elements
 */
import { removeClipMaskAttributes, restoreOriginalAttributes } from './clip-mask-attributes';

/**
 * Removes a clip mask from a path element
 */
export const removeClipMask = (svgPath: SVGPathElement | null): boolean => {
  try {
    if (!svgPath) return false;
    
    // Remove clip path
    svgPath.removeAttribute('clip-path');
    
    // Restore original attributes
    restoreOriginalAttributes(svgPath);
    
    // Remove the data attributes
    removeClipMaskAttributes(svgPath);
    
    // Remove the pattern and clip path elements if they exist
    const svg = svgPath.closest('svg');
    if (svg) {
      const drawingId = svgPath.getAttribute('data-drawing-id');
      if (drawingId) {
        const defs = svg.querySelector('defs');
        if (defs) {
          const clipId = `clip-${drawingId}`;
          const patternId = `pattern-${drawingId}`;
          
          const clipPath = defs.querySelector(`#${clipId}`);
          if (clipPath) defs.removeChild(clipPath);
          
          const pattern = defs.querySelector(`#${patternId}`);
          if (pattern) defs.removeChild(pattern);
        }
      }
    }
    
    return true;
  } catch (err) {
    console.error('Error removing clip mask:', err);
    return false;
  }
};
