
/**
 * Core operations for SVG clip masks
 */
import { toast } from 'sonner';

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

/**
 * Creates and applies an SVG clip mask with an image to a path element
 */
export const applyImageClipMask = (
  pathElement: SVGPathElement | null, 
  imageUrl: string, 
  id: string
): boolean => {
  if (!pathElement || !imageUrl) {
    console.error('Cannot apply clip mask: missing path or image URL');
    return false;
  }
  
  try {
    console.log(`Applying clip mask for drawing ${id} with image URL: ${imageUrl.substring(0, 50)}...`);
    
    // Check if already has clip mask (improved check)
    if (hasClipMaskApplied(pathElement)) {
      console.log(`Path for drawing ${id} already has clip mask, skipping application`);
      return true;
    }
    
    // Get the SVG element that contains this path
    const svg = pathElement.closest('svg');
    if (!svg) {
      console.error('SVG path is not within an SVG element');
      return false;
    }
    
    // Create unique IDs for the clip path and pattern
    const clipId = `clip-${id}`;
    const patternId = `pattern-${id}`;
    
    // Get the path data
    const pathData = pathElement.getAttribute('d');
    if (!pathData) {
      console.error('SVG path has no path data (d attribute)');
      return false;
    }
    
    // Store original path data and style for potential restoration
    pathElement.setAttribute('data-original-d', pathData);
    pathElement.setAttribute('data-original-fill', pathElement.getAttribute('fill') || '');
    pathElement.setAttribute('data-original-stroke', pathElement.getAttribute('stroke') || '');
    
    // Create the defs section if it doesn't exist
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);
    }
    
    // Clean up any existing elements with the same IDs first
    const existingClipPath = defs.querySelector(`#${clipId}`);
    if (existingClipPath) defs.removeChild(existingClipPath);
    
    const existingPattern = defs.querySelector(`#${patternId}`);
    if (existingPattern) defs.removeChild(existingPattern);
    
    // Create a clip path element
    let clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', clipId);
    defs.appendChild(clipPath);
    
    // Create a path for the clip path
    const clipPathPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    clipPathPath.setAttribute('d', pathData);
    clipPath.appendChild(clipPathPath);
    
    // Create a pattern for the image
    let pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', patternId);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', '100%');
    pattern.setAttribute('height', '100%');
    defs.appendChild(pattern);
    
    // Get the bounding box to properly size the pattern
    const bbox = pathElement.getBBox();
    pattern.setAttribute('x', String(bbox.x));
    pattern.setAttribute('y', String(bbox.y));
    pattern.setAttribute('width', String(bbox.width));
    pattern.setAttribute('height', String(bbox.height));
    
    // Create an image element for the pattern
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('href', imageUrl);
    image.setAttribute('width', '100%');
    image.setAttribute('height', '100%');
    image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    pattern.appendChild(image);
    
    // Set default values for rotation and scale
    pathElement.setAttribute('data-image-rotation', '0');
    pathElement.setAttribute('data-image-scale', '1');
    
    // Apply changes in a single batch using RAF to reduce visual flickering
    requestAnimationFrame(() => {
      // Mark as having clip mask first (prevents race conditions)
      pathElement.setAttribute('data-has-clip-mask', 'true');
      pathElement.setAttribute('data-last-updated', Date.now().toString());
      
      // Apply pattern fill first
      pathElement.setAttribute('fill', `url(#${patternId})`);
      
      // Remove stroke for better appearance
      pathElement.setAttribute('stroke', 'none');
      
      // Apply clip path after a small delay to reduce flicker
      setTimeout(() => {
        if (pathElement) {
          pathElement.setAttribute('clip-path', `url(#${clipId})`);
        }
      }, 20);
    });
    
    return true;
  } catch (err) {
    console.error('Error applying image clip mask:', err);
    toast.error('Failed to apply floor plan image');
    return false;
  }
};

/**
 * Removes a clip mask from a path element
 */
export const removeClipMask = (svgPath: SVGPathElement | null): boolean => {
  try {
    if (!svgPath) return false;
    
    // Remove clip path and restore original fill and stroke
    svgPath.removeAttribute('clip-path');
    
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
    
    // Remove the data-has-clip-mask attribute
    svgPath.removeAttribute('data-has-clip-mask');
    svgPath.removeAttribute('data-image-url');
    svgPath.removeAttribute('data-image-rotation');
    svgPath.removeAttribute('data-image-scale');
    svgPath.removeAttribute('data-last-updated');
    
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
