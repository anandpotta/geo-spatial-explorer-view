
/**
 * Utilities for finding SVG path elements in the DOM
 */

/**
 * Searches for an SVG path element associated with a drawing ID
 * Uses multiple strategies to find the element
 */
export const findSvgPathByDrawingId = (drawingId: string): SVGPathElement | null => {
  try {
    // First try finding by the data attribute (most reliable)
    let path = document.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
    if (path) {
      console.log(`Found path with data-drawing-id attribute for ${drawingId}`);
      return path;
    }
    
    // Try finding by ID
    path = document.getElementById(`drawing-path-${drawingId}`) as SVGPathElement;
    if (path) {
      console.log(`Found path with id for ${drawingId}`);
      return path;
    }
    
    // Try finding by class
    const shortId = drawingId.substring(0, 8);
    path = document.querySelector(`.drawing-path-${shortId}`) as SVGPathElement;
    if (path) {
      console.log(`Found path with class for ${drawingId}`);
      return path;
    }
    
    // Look in the leaflet overlay pane
    const overlayPanes = document.querySelectorAll('.leaflet-overlay-pane');
    for (const pane of Array.from(overlayPanes)) {
      // Try by data attribute
      path = pane.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
      if (path) {
        console.log(`Found path in overlay pane with data attribute for ${drawingId}`);
        return path;
      }
      
      // Try by id
      path = pane.querySelector(`#drawing-path-${drawingId}`) as SVGPathElement;
      if (path) {
        console.log(`Found path in overlay pane with id for ${drawingId}`);
        return path;
      }
      
      // Try by class
      path = pane.querySelector(`.drawing-path-${shortId}`) as SVGPathElement;
      if (path) {
        console.log(`Found path in overlay pane with class for ${drawingId}`);
        return path;
      }
      
      // If still not found, try all interactive paths and check attributes
      const interactivePaths = pane.querySelectorAll('path.leaflet-interactive');
      for (const interactivePath of Array.from(interactivePaths)) {
        if (interactivePath.getAttribute('data-drawing-id') === drawingId ||
            interactivePath.id === `drawing-path-${drawingId}` ||
            interactivePath.classList.contains(`drawing-path-${shortId}`)) {
          console.log(`Found interactive path for ${drawingId}`);
          return interactivePath as SVGPathElement;
        }
      }
    }
    
    console.warn(`Could not find SVG path for drawing ${drawingId}`);
    return null;
  } catch (err) {
    console.error('Error finding SVG path:', err);
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
  maskedPaths.forEach(path => paths.push(path as SVGPathElement));
  
  // Find paths with clip-path style or attribute
  const clipPaths = document.querySelectorAll('path[clip-path^="url(#clip-"]');
  clipPaths.forEach(path => {
    if (!paths.includes(path as SVGPathElement)) {
      paths.push(path as SVGPathElement);
    }
  });
  
  // Find paths with pattern fill
  const patternPaths = document.querySelectorAll('path[fill^="url(#pattern-"]');
  patternPaths.forEach(path => {
    if (!paths.includes(path as SVGPathElement)) {
      paths.push(path as SVGPathElement);
    }
  });
  
  return paths;
};
