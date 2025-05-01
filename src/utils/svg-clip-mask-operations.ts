
/**
 * Core operations for SVG clip masks
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
    pathClone.removeAttribute('fill-opacity');
    clipPath.appendChild(pathClone);
    
    // Create pattern
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.id = patternId;
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', bbox.width.toString());
    pattern.setAttribute('height', bbox.height.toString());
    pattern.setAttribute('x', bbox.x.toString());
    pattern.setAttribute('y', bbox.y.toString());
    pattern.setAttribute('patternContentUnits', 'userSpaceOnUse');
    
    // Create image element
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('href', imageUrl);
    image.setAttribute('width', bbox.width.toString());
    image.setAttribute('height', bbox.height.toString());
    image.setAttribute('x', bbox.x.toString());
    image.setAttribute('y', bbox.y.toString());
    image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    
    // Set initial rotation
    const rotation = pathElement.getAttribute('data-image-rotation') || '0';
    const scale = pathElement.getAttribute('data-image-scale') || '1';
    
    // Apply transformation to the image
    const centerX = bbox.width / 2 + bbox.x;
    const centerY = bbox.height / 2 + bbox.y;
    image.setAttribute('transform', `rotate(${rotation} ${centerX} ${centerY}) scale(${scale})`);
    
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
    
    // Apply pattern fill and ensure no fill-opacity to allow image to show properly
    pathElement.setAttribute('fill', `url(#${patternId})`);
    pathElement.removeAttribute('fill-opacity');
    
    // Store image metadata
    pathElement.setAttribute('data-has-clip-mask', 'true');
    pathElement.setAttribute('data-image-url', imageUrl);
    pathElement.setAttribute('data-image-rotation', rotation);
    pathElement.setAttribute('data-image-scale', scale);
    
    // Apply clip path with a slight delay to ensure fill is applied first
    setTimeout(() => {
      if (pathElement) {
        pathElement.setAttribute('clip-path', `url(#${clipPathId})`);
        console.log(`Successfully applied clip mask and pattern for drawing ${id}`);
        
        // Force a redraw of the SVG
        const svgText = svg.outerHTML;
        const parent = svg.parentNode;
        if (parent) {
          svg.setAttribute('data-force-redraw', Date.now().toString());
        }
      }
    }, 50);
    
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
    // Find related IDs
    const drawingId = pathElement.getAttribute('data-drawing-id');
    if (drawingId) {
      // Clean up any related definitions
      const clipPathId = `clip-path-${drawingId}`;
      const patternId = `pattern-${drawingId}`;
      
      const clipPathEl = document.getElementById(clipPathId);
      if (clipPathEl) clipPathEl.remove();
      
      const patternEl = document.getElementById(patternId);
      if (patternEl) patternEl.remove();
    }
    
    // Remove all clip mask related attributes
    pathElement.removeAttribute('clip-path');
    pathElement.removeAttribute('data-has-clip-mask');
    pathElement.removeAttribute('data-image-url');
    pathElement.removeAttribute('data-image-rotation');
    pathElement.removeAttribute('data-image-scale');
    
    // Restore original fill if needed
    if (pathElement.hasAttribute('data-original-fill')) {
      const originalFill = pathElement.getAttribute('data-original-fill');
      pathElement.setAttribute('fill', originalFill || '');
      pathElement.removeAttribute('data-original-fill');
      
      // Reset fill-opacity to default
      pathElement.setAttribute('fill-opacity', '0.2');
    } else {
      // Default fill if no original saved
      pathElement.setAttribute('fill', 'rgba(51, 136, 255, 0.3)');
      pathElement.setAttribute('fill-opacity', '0.2');
    }
    
    return true;
  } catch (err) {
    console.error('Error removing clip mask:', err);
    return false;
  }
};
