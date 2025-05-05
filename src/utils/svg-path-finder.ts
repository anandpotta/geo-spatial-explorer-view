
/**
 * Utilities for finding SVG path elements
 */

/**
 * Finds an SVG path element by its drawing ID
 */
export const findSvgPathByDrawingId = (
  drawingId: string, 
  container?: HTMLElement | null
): SVGPathElement | null => {
  try {
    // If no container provided, use document body
    const searchRoot = container || document.body;
    
    // Search for paths with the data attribute first (most reliable)
    let path = searchRoot.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
    
    // If not found, try with class name
    if (!path) {
      path = searchRoot.querySelector(`.drawing-path-${drawingId.substring(0, 8)}`) as SVGPathElement;
    }
    
    // If still not found, look in all leaflet interactive paths
    if (!path) {
      const allPaths = Array.from(searchRoot.querySelectorAll('path.leaflet-interactive'));
      
      // Check if any path has the drawing ID in any attribute
      path = allPaths.find(p => {
        const attrs = Array.from(p.attributes);
        return attrs.some(attr => attr.value.includes(drawingId));
      }) as SVGPathElement || null;
      
      // Fall back to searching in parent elements
      if (!path) {
        const parentElements = Array.from(searchRoot.querySelectorAll('[data-drawing-container]'));
        for (const parent of parentElements) {
          if (parent.getAttribute('data-drawing-container') === drawingId) {
            path = parent.querySelector('path') as SVGPathElement;
            if (path) break;
          }
        }
      }
    }
    
    return path;
  } catch (err) {
    console.error(`Error finding SVG path for drawing ${drawingId}:`, err);
    return null;
  }
};
