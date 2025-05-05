
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
  const existingClipPath = defs.querySelector(`#clip-${id}`);
  if (existingClipPath) defs.removeChild(existingClipPath);
  
  const existingPattern = defs.querySelector(`#pattern-${id}`);
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
    
    pathElement.style.fill = fill;
    pathElement.style.stroke = 'none';
    pathElement.style.clipPath = clipPathUrl;
    
    // Also set attributes as backup in case styles are reset
    pathElement.setAttribute('fill', fill);
    pathElement.setAttribute('stroke', 'none');
    pathElement.setAttribute('clip-path', clipPathUrl);
  });
};
