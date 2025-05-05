
/**
 * Utilities for creating and managing SVG clip paths
 */

/**
 * Creates a clip path element in the SVG defs
 */
export const createClipPath = (
  defs: SVGDefsElement,
  id: string,
  pathData: string
): SVGClipPathElement => {
  // Create a clip path element
  const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  clipPath.setAttribute('id', `clip-${id}`);
  
  // Enable userSpaceOnUse to use the absolute coordinates of the path
  clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
  
  defs.appendChild(clipPath);
  
  // Create a path for the clip path
  const clipPathPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  clipPathPath.setAttribute('d', pathData);
  clipPath.appendChild(clipPathPath);
  
  return clipPath;
};

/**
 * Cleans up existing clip path and pattern elements for a drawing ID
 */
export const cleanupExistingElements = (defs: SVGDefsElement, id: string): void => {
  // Use safer querySelector with proper escaping for IDs with special characters
  const existingClipPath = defs.querySelector(`#clip-${CSS.escape(id)}`);
  if (existingClipPath) defs.removeChild(existingClipPath);
  
  const existingPattern = defs.querySelector(`#pattern-${CSS.escape(id)}`);
  if (existingPattern) defs.removeChild(existingPattern);
};

/**
 * Applies the final clip mask attributes to a path element
 */
export const applyClipPathAndFill = (
  pathElement: SVGPathElement,
  id: string
): void => {
  // Use requestAnimationFrame for smoother visual updates
  requestAnimationFrame(() => {
    if (!pathElement || !document.contains(pathElement)) return;
    
    // Apply all changes in a single batch to reduce visual flickering
    const fill = `url(#pattern-${id})`;
    const clipPathUrl = `url(#clip-${id})`;
    
    console.log(`Applying clip path and fill to path: ${id}`);
    
    // Apply inline styles first (higher precedence)
    pathElement.style.fill = fill;
    pathElement.style.stroke = 'none';
    pathElement.style.clipPath = clipPathUrl;
    
    // Also set attributes as backup in case styles are reset
    pathElement.setAttribute('fill', fill);
    pathElement.setAttribute('stroke', 'none');
    pathElement.setAttribute('clip-path', clipPathUrl);
    
    // Apply directly to SVG elements with both methods for maximum browser compatibility
    try {
      // Modern browsers
      pathElement.style.setProperty('clip-path', clipPathUrl, 'important');
      pathElement.style.setProperty('fill', fill, 'important');
      
      // Ensure visibility
      pathElement.style.setProperty('visibility', 'visible', 'important');
      pathElement.style.setProperty('display', 'inline', 'important');
      
      // Force immediate redraw
      pathElement.getBoundingClientRect();
    } catch (e) {
      console.warn('Error applying style properties', e);
    }
    
    // Double apply after a short delay to ensure it takes effect
    setTimeout(() => {
      if (pathElement && document.contains(pathElement)) {
        pathElement.style.fill = fill;
        pathElement.style.clipPath = clipPathUrl;
        pathElement.setAttribute('fill', fill);
        pathElement.setAttribute('clip-path', clipPathUrl);
      }
    }, 50);
  });
};

