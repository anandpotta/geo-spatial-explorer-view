
/**
 * Utility functions for creating SVG clip paths
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
