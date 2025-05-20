
import { toast } from 'sonner';

/**
 * Find an SVG path element by drawing ID
 * More robust implementation with multiple search strategies
 */
export const findSvgPathByDrawingId = (drawingId: string): SVGPathElement | null => {
  if (!drawingId) {
    console.error('No drawing ID provided to findSvgPathByDrawingId');
    return null;
  }
  
  console.log(`Looking for SVG path for drawing ID: ${drawingId}`);
  
  // First try direct attribute selector (most efficient)
  let pathElement = document.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
  
  if (pathElement) {
    console.log(`Found path directly by attribute selector for ${drawingId}`);
    return pathElement;
  }
  
  // If not found, try looking in the map panes
  const mapPanes = document.querySelector('.leaflet-map-pane');
  if (mapPanes) {
    // Search within map overlay pane first (where drawings typically reside)
    const overlayPane = mapPanes.querySelector('.leaflet-overlay-pane');
    if (overlayPane) {
      // Look for path with the drawing ID as a data attribute
      pathElement = overlayPane.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
      
      if (pathElement) {
        console.log(`Found path in overlay pane for ${drawingId}`);
        return pathElement;
      }
      
      // If not found by data attribute, search all paths and check their class/ID attributes
      const paths = Array.from(overlayPane.querySelectorAll('path'));
      
      for (const path of paths) {
        const pathId = path.id || '';
        const pathClass = path.className?.baseVal || '';
        
        // Check if the ID contains our drawing ID
        if (pathId.includes(drawingId) || pathClass.includes(drawingId)) {
          console.log(`Found path by ID/class match for ${drawingId}`);
          // Add the data attribute for future lookups
          path.setAttribute('data-drawing-id', drawingId);
          return path as SVGPathElement;
        }
      }
      
      console.log(`Checking all paths in overlay pane for drawing ${drawingId}`);
      
      // Last resort: inspect the style.fill property for pattern references
      for (const path of paths) {
        const fillStyle = path.getAttribute('fill') || path.style.fill || '';
        if (fillStyle.includes(drawingId) || 
            (path as any).drawingId === drawingId) {
          console.log(`Found path by fill pattern for ${drawingId}`);
          // Add the data attribute for future lookups
          path.setAttribute('data-drawing-id', drawingId);
          return path as SVGPathElement;
        }
      }
    }
  }
  
  // If still not found, do a document-wide search for any SVG path that might match
  const allPaths = Array.from(document.querySelectorAll('path'));
  
  for (const path of allPaths) {
    // Check various attributes that might contain the drawing ID
    const dataDrawingId = path.getAttribute('data-drawing-id');
    const dataId = path.getAttribute('data-id');
    const fillAttr = path.getAttribute('fill');
    
    if (dataDrawingId === drawingId || 
        dataId === drawingId || 
        (fillAttr && fillAttr.includes(drawingId)) ||
        (path as any).drawingId === drawingId) {
      console.log(`Found path by document-wide search for ${drawingId}`);
      return path as SVGPathElement;
    }
  }
  
  console.error(`Could not find SVG path element for drawing ID: ${drawingId}`);
  return null;
};

/**
 * Debug helper to verify an SVG element is properly in the DOM
 */
export const debugSvgElement = (element: SVGElement, message: string): void => {
  console.log(`[DEBUG SVG] ${message}:`, {
    element,
    inDOM: document.contains(element),
    parentNode: element.parentNode,
    attributes: Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`),
    tagName: element.tagName,
    fill: element.getAttribute('fill') || element.style.fill || 'none',
  });
};

/**
 * Ensure drawing ID is properly attached to SVG path
 */
export const ensureDrawingIdOnPath = (pathElement: SVGPathElement, drawingId: string): void => {
  if (pathElement && drawingId) {
    pathElement.setAttribute('data-drawing-id', drawingId);
  }
};
