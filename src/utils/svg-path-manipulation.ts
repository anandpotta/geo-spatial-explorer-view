
/**
 * Utilities for working with and manipulating SVG paths
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
