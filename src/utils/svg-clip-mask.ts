/**
 * Utilities for handling SVG clip masks and images
 */

/**
 * Creates and applies an SVG clip mask with an image to a path element
 */
export const applyImageClipMask = (
  pathElement: SVGPathElement | null, 
  imageUrl: string, 
  id: string
): boolean => {
  if (!pathElement || !imageUrl) return false;
  
  try {
    console.log(`Applying clip mask for drawing ${id} with image URL: ${imageUrl.substring(0, 50)}...`);
    
    // Get the SVG root element
    const svg = pathElement.ownerSVGElement;
    if (!svg) {
      console.error('SVG element not found for path');
      return false;
    }
    
    // Get the bounding box of the path
    const bbox = pathElement.getBBox();
    console.log(`Path bounding box:`, bbox);
    
    // Generate unique IDs
    const clipPathId = `clip-path-${id}`;
    const patternId = `pattern-${id}`;
    
    // Find or create defs section
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);
    }
    
    // Remove any existing elements with these IDs
    const existingClipPath = document.getElementById(clipPathId);
    if (existingClipPath) existingClipPath.remove();
    
    const existingPattern = document.getElementById(patternId);
    if (existingPattern) existingPattern.remove();
    
    // Create clip path
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.id = clipPathId;
    clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
    
    // Clone the path for the clip path
    const pathClone = pathElement.cloneNode(true) as SVGPathElement;
    pathClone.removeAttribute('clip-path');
    pathClone.removeAttribute('fill');
    clipPath.appendChild(pathClone);
    
    // Create pattern
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.id = patternId;
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', bbox.width.toString());
    pattern.setAttribute('height', bbox.height.toString());
    pattern.setAttribute('x', bbox.x.toString());
    pattern.setAttribute('y', bbox.y.toString());
    
    // Create image element
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('href', imageUrl);
    image.setAttribute('width', bbox.width.toString());
    image.setAttribute('height', bbox.height.toString());
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    
    // Append to defs
    pattern.appendChild(image);
    defs.appendChild(clipPath);
    defs.appendChild(pattern);
    
    // Store original fill if not already stored
    if (!pathElement.hasAttribute('data-original-fill')) {
      const originalFill = pathElement.getAttribute('fill');
      if (originalFill) {
        pathElement.setAttribute('data-original-fill', originalFill);
      }
    }
    
    // Apply pattern fill first
    pathElement.setAttribute('fill', `url(#${patternId})`);
    
    // Apply clip path after a slight delay to ensure fill is applied first
    setTimeout(() => {
      pathElement.setAttribute('clip-path', `url(#${clipPathId})`);
      
      // Mark the path as having a clip mask
      pathElement.setAttribute('data-has-clip-mask', 'true');
      pathElement.setAttribute('data-image-url', imageUrl);
      
      console.log(`Successfully applied clip mask and pattern for drawing ${id}`);
    }, 10);
    
    return true;
  } catch (err) {
    console.error('Error applying image clip mask:', err);
    return false;
  }
};

/**
 * Removes a clip mask from a path element
 */
export const removeClipMask = (pathElement: SVGPathElement | null): boolean => {
  if (!pathElement) return false;
  
  try {
    pathElement.removeAttribute('clip-path');
    pathElement.removeAttribute('data-has-clip-mask');
    pathElement.removeAttribute('data-image-url');
    
    // Restore original fill if needed
    if (pathElement.hasAttribute('data-original-fill')) {
      const originalFill = pathElement.getAttribute('data-original-fill');
      pathElement.setAttribute('fill', originalFill || '');
      pathElement.removeAttribute('data-original-fill');
    } else {
      // Default fill if no original saved
      pathElement.setAttribute('fill', 'rgba(51, 136, 255, 0.3)');
    }
    
    return true;
  } catch (err) {
    console.error('Error removing clip mask:', err);
    return false;
  }
};

/**
 * Finds an SVG path element by drawing ID with multiple selector strategies
 */
export const findSvgPathByDrawingId = (drawingId: string): SVGPathElement | null => {
  // First try the data-drawing-id attribute (primary method)
  let pathElement = document.querySelector(`.leaflet-interactive[data-drawing-id="${drawingId}"]`) as SVGPathElement;
  
  if (!pathElement) {
    // Try looking in all leaflet-pane elements
    const leafletPanes = document.querySelectorAll('.leaflet-pane');
    for (const pane of Array.from(leafletPanes)) {
      const paths = pane.querySelectorAll('path');
      for (const path of Array.from(paths)) {
        if (path.getAttribute('data-drawing-id') === drawingId) {
          pathElement = path as SVGPathElement;
          break;
        }
      }
      if (pathElement) break;
    }
  }
  
  // Try alternate leaflet-specific selectors as last resort
  if (!pathElement) {
    // Look for path elements in specific overlay pane
    const overlayPane = document.querySelector('.leaflet-overlay-pane');
    if (overlayPane) {
      const paths = overlayPane.querySelectorAll('path.leaflet-interactive');
      
      // If we don't have many paths, we can check each one
      if (paths.length < 10) {
        console.log(`Found ${paths.length} path elements in overlay pane, checking each...`);
        // We'll use a simple heuristic - if we have very few paths, it might be the one we want
        if (paths.length === 1) {
          pathElement = paths[0] as SVGPathElement;
        }
      }
    }
  }
  
  return pathElement;
};
