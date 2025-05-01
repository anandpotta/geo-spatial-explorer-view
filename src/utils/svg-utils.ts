
/**
 * Utilities for working with SVG paths and elements
 */

/**
 * Extract an SVG path string from a Leaflet layer or path element
 */
export const getSvgPathFromElement = (element: SVGPathElement | null): string | null => {
  if (!element) return null;
  return element.getAttribute('d');
};

/**
 * Converts a path to a simplified version with fewer points
 */
export const simplifyPath = (pathData: string, tolerance: number = 1): string => {
  if (!pathData) return '';
  
  // Simple implementation of path simplification
  // This extracts points from the path and reduces them
  const points = extractPointsFromPath(pathData);
  const simplified = simplifyPoints(points, tolerance);
  return pointsToPathData(simplified);
};

/**
 * Extracts points from an SVG path string
 */
export const extractPointsFromPath = (pathData: string): [number, number][] => {
  const points: [number, number][] = [];
  const commands = pathData.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g) || [];
  
  let currentX = 0, currentY = 0;
  
  commands.forEach(cmd => {
    const type = cmd[0];
    const values = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat);
    
    switch (type) {
      case 'M': // Move to (absolute)
        for (let i = 0; i < values.length; i += 2) {
          currentX = values[i];
          currentY = values[i + 1];
          points.push([currentX, currentY]);
        }
        break;
      case 'L': // Line to (absolute)
        for (let i = 0; i < values.length; i += 2) {
          currentX = values[i];
          currentY = values[i + 1];
          points.push([currentX, currentY]);
        }
        break;
      // Add other path commands as needed
    }
  });
  
  return points;
};

/**
 * Simplify an array of points using the Ramer-Douglas-Peucker algorithm
 */
export const simplifyPoints = (points: [number, number][], tolerance: number): [number, number][] => {
  if (points.length <= 2) return points;
  
  // Basic implementation of point reduction
  // For a real implementation, consider a library like simplify-js
  const simplified: [number, number][] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [prevX, prevY] = simplified[simplified.length - 1];
    
    // Only add points that are at least tolerance distance away from the previous point
    const distance = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2));
    if (distance > tolerance) {
      simplified.push(points[i]);
    }
  }
  
  // Add the last point
  simplified.push(points[points.length - 1]);
  return simplified;
};

/**
 * Convert an array of points back to SVG path data
 */
export const pointsToPathData = (points: [number, number][]): string => {
  if (points.length === 0) return '';
  
  let pathData = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    pathData += ` L${points[i][0]},${points[i][1]}`;
  }
  return pathData;
};

/**
 * Get all SVG paths from a container element
 */
export const getAllSvgPaths = (container: HTMLElement | null): SVGPathElement[] => {
  if (!container) return [];
  return Array.from(container.querySelectorAll('path'));
};

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
    // Get the bounding box of the path
    const bbox = pathElement.getBBox();
    const svg = pathElement.ownerSVGElement;
    
    if (!svg) {
      console.error('SVG element not found');
      return false;
    }
    
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
    
    // Clone the path for the clip path
    const pathClone = pathElement.cloneNode(true) as SVGPathElement;
    // Remove any existing clip-path or fill attributes from the clone
    pathClone.removeAttribute('clip-path');
    pathClone.removeAttribute('fill');
    clipPath.appendChild(pathClone);
    
    // Create pattern
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.id = patternId;
    
    // Set pattern attributes
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
    
    // Apply to original path
    pathElement.setAttribute('clip-path', `url(#${clipPathId})`);
    pathElement.setAttribute('fill', `url(#${patternId})`);
    
    // Mark the path as having a clip mask
    pathElement.setAttribute('data-has-clip-mask', 'true');
    pathElement.setAttribute('data-image-url', imageUrl);
    
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

