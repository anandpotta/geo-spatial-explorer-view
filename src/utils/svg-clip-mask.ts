
/**
 * Main utilities for handling SVG clip masks and images
 */
import { rotateImageInClipMask, scaleImageInClipMask } from './svg-image-operations';

/**
 * Finds an SVG path element by drawing ID with multiple selector strategies
 */
export const findSvgPathByDrawingId = (drawingId: string): SVGPathElement | null => {
  // First try the data-drawing-id attribute (primary method)
  let pathElement = document.querySelector(`path[data-drawing-id="${drawingId}"]`) as SVGPathElement;
  
  if (!pathElement) {
    // Try a broader selector on leaflet-interactive class
    pathElement = document.querySelector(`.leaflet-interactive[data-drawing-id="${drawingId}"]`) as SVGPathElement;
  }
  
  if (!pathElement) {
    // Try every path element to find one with the right drawing ID attribute or class
    const allPaths = document.querySelectorAll('path.leaflet-interactive');
    console.log(`Checking ${allPaths.length} interactive paths for drawing ID ${drawingId}`);
    
    for (const path of Array.from(allPaths)) {
      // Check for the data-drawing-id attribute
      const id = path.getAttribute('data-drawing-id');
      console.log(`Path element data-drawing-id: ${id}`);
      
      // Also check for class that might contain the ID
      const classes = path.classList;
      let foundInClass = false;
      
      if (classes) {
        for (let i = 0; i < classes.length; i++) {
          if (classes[i].includes(drawingId)) {
            console.log(`Found drawing ID in class: ${classes[i]}`);
            foundInClass = true;
          }
        }
      }
      
      if (id === drawingId || foundInClass) {
        console.log(`Found path element for drawing ${drawingId} by direct examination`);
        pathElement = path as SVGPathElement;
        
        // Add the data-drawing-id attribute if it doesn't exist
        if (!id) {
          path.setAttribute('data-drawing-id', drawingId);
        }
        break;
      }
    }
  }
  
  if (!pathElement) {
    // As a fallback, try to find it in the leaflet overlay pane
    const overlayPane = document.querySelector('.leaflet-overlay-pane');
    if (overlayPane) {
      const paths = overlayPane.querySelectorAll('path');
      console.log(`Checking ${paths.length} paths in overlay pane for drawing ID ${drawingId}`);
      
      if (paths.length === 1 && !paths[0].getAttribute('data-drawing-id')) {
        // If there's only one path and it doesn't have an ID, let's assume it's the one we want
        console.log('Single path without ID found, using it as fallback');
        pathElement = paths[0] as SVGPathElement;
        pathElement.setAttribute('data-drawing-id', drawingId);
      } else {
        // Try to match by path data or other attributes
        paths.forEach((path, index) => {
          const pathId = path.getAttribute('data-drawing-id');
          console.log(`Path ${index} ID: ${pathId}`);
          
          if (pathId === drawingId) {
            pathElement = path as SVGPathElement;
          }
        });
      }
    }
  }
  
  return pathElement;
};

// Export all functions from the clip mask and image operations modules
export {
  applyImageClipMask,
  removeClipMask
} from './svg-clip-mask-operations';

export { rotateImageInClipMask, scaleImageInClipMask };
