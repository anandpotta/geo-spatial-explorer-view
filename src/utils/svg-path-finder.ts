
/**
 * Utilities for finding SVG path elements in the DOM
 */

/**
 * Safely cast an HTMLElement to SVGPathElement with type checking
 */
const safeCastToSVGPath = (element: Element | null): SVGPathElement | null => {
  if (!element) return null;
  
  // Check if the element is indeed an SVG path element before casting
  if (element.tagName.toLowerCase() === 'path' && 
      element instanceof SVGElement && 
      'getTotalLength' in element) {
    return element as SVGPathElement;
  }
  
  return null;
};

/**
 * Searches for an SVG path element associated with a drawing ID
 * Uses multiple strategies to find the element
 */
export const findSvgPathByDrawingId = (drawingId: string): SVGPathElement | null => {
  try {
    console.log(`[SVG Path Finder] Searching for drawing ID: ${drawingId}`);
    
    // First try finding by the data attribute (most reliable)
    let pathElement = document.querySelector(`path[data-drawing-id="${drawingId}"]`);
    let path = safeCastToSVGPath(pathElement);
    if (path) {
      console.log(`[SVG Path Finder] Found path with data-drawing-id attribute for ${drawingId}`);
      return path;
    }
    
    // Try finding by ID
    pathElement = document.getElementById(`drawing-path-${drawingId}`);
    path = safeCastToSVGPath(pathElement);
    if (path) {
      console.log(`[SVG Path Finder] Found path with id for ${drawingId}`);
      return path;
    }
    
    // Try finding by class
    const shortId = drawingId.substring(0, 8);
    pathElement = document.querySelector(`.drawing-path-${shortId}`);
    path = safeCastToSVGPath(pathElement);
    if (path) {
      console.log(`[SVG Path Finder] Found path with class for ${drawingId}`);
      return path;
    }
    
    // Debug: Log all available paths and their attributes
    const allPaths = document.querySelectorAll('path');
    console.log(`[SVG Path Finder] Total paths in document: ${allPaths.length}`);
    
    allPaths.forEach((p, index) => {
      const pathElement = p as SVGPathElement;
      console.log(`[SVG Path Finder] Path ${index}:`, {
        id: pathElement.id,
        dataDrawingId: pathElement.getAttribute('data-drawing-id'),
        className: pathElement.className.baseVal || pathElement.className,
        classList: Array.from(pathElement.classList),
        isLeafletInteractive: pathElement.classList.contains('leaflet-interactive'),
        parentElement: pathElement.parentElement?.tagName
      });
    });
    
    // Look in the leaflet overlay pane with enhanced debugging
    const overlayPanes = document.querySelectorAll('.leaflet-overlay-pane');
    console.log(`[SVG Path Finder] Found ${overlayPanes.length} overlay panes`);
    
    for (const pane of Array.from(overlayPanes)) {
      console.log(`[SVG Path Finder] Searching in overlay pane`);
      
      // Try by data attribute
      pathElement = pane.querySelector(`path[data-drawing-id="${drawingId}"]`);
      path = safeCastToSVGPath(pathElement);
      if (path) {
        console.log(`[SVG Path Finder] Found path in overlay pane with data attribute for ${drawingId}`);
        return path;
      }
      
      // Try by id
      pathElement = pane.querySelector(`#drawing-path-${drawingId}`);
      path = safeCastToSVGPath(pathElement);
      if (path) {
        console.log(`[SVG Path Finder] Found path in overlay pane with id for ${drawingId}`);
        return path;
      }
      
      // Try by class
      pathElement = pane.querySelector(`.drawing-path-${shortId}`);
      path = safeCastToSVGPath(pathElement);
      if (path) {
        console.log(`[SVG Path Finder] Found path in overlay pane with class for ${drawingId}`);
        return path;
      }
      
      // If still not found, try all interactive paths and check attributes
      const interactivePaths = pane.querySelectorAll('path.leaflet-interactive');
      console.log(`[SVG Path Finder] Found ${interactivePaths.length} interactive paths in pane`);
      
      for (const interactivePath of Array.from(interactivePaths)) {
        const pathEl = interactivePath as SVGPathElement;
        console.log(`[SVG Path Finder] Checking interactive path:`, {
          dataDrawingId: pathEl.getAttribute('data-drawing-id'),
          id: pathEl.id,
          classes: Array.from(pathEl.classList)
        });
        
        if (pathEl.getAttribute('data-drawing-id') === drawingId ||
            pathEl.id === `drawing-path-${drawingId}` ||
            pathEl.classList.contains(`drawing-path-${shortId}`)) {
          path = safeCastToSVGPath(pathEl);
          if (path) {
            console.log(`[SVG Path Finder] Found interactive path for ${drawingId}`);
            return path;
          }
        }
      }
      
      // Last resort: if we have exactly one interactive path and no specific match, 
      // it might be the one we're looking for (common in single-shape scenarios)
      if (interactivePaths.length === 1) {
        const singlePath = interactivePaths[0] as SVGPathElement;
        console.log(`[SVG Path Finder] Single path found, checking if it could be our target:`, {
          id: singlePath.id,
          dataDrawingId: singlePath.getAttribute('data-drawing-id'),
          hasAttributes: singlePath.hasAttributes()
        });
        
        // If the path has no drawing ID set, it might be the one we need to attribute
        if (!singlePath.getAttribute('data-drawing-id')) {
          console.log(`[SVG Path Finder] Found unattributed path, setting drawing ID to ${drawingId}`);
          singlePath.setAttribute('data-drawing-id', drawingId);
          return singlePath;
        }
      }
    }
    
    console.warn(`[SVG Path Finder] Could not find SVG path for drawing ${drawingId} after exhaustive search`);
    return null;
  } catch (err) {
    console.error('[SVG Path Finder] Error finding SVG path:', err);
    return null;
  }
};

/**
 * Finds all SVG paths in the document that have clip masks applied
 */
export const findAllClipMaskedPaths = (): SVGPathElement[] => {
  const paths: SVGPathElement[] = [];
  
  // Find paths with data-has-clip-mask attribute
  const maskedPaths = document.querySelectorAll('path[data-has-clip-mask="true"]');
  maskedPaths.forEach(path => {
    const svgPath = safeCastToSVGPath(path);
    if (svgPath) {
      paths.push(svgPath);
    }
  });
  
  // Find paths with clip-path style or attribute
  const clipPaths = document.querySelectorAll('path[clip-path^="url(#clip-"]');
  clipPaths.forEach(path => {
    const svgPath = safeCastToSVGPath(path);
    if (svgPath && !paths.includes(svgPath)) {
      paths.push(svgPath);
    }
  });
  
  // Find paths with pattern fill
  const patternPaths = document.querySelectorAll('path[fill^="url(#pattern-"]');
  patternPaths.forEach(path => {
    const svgPath = safeCastToSVGPath(path);
    if (svgPath && !paths.includes(svgPath)) {
      paths.push(svgPath);
    }
  });
  
  return paths;
};
