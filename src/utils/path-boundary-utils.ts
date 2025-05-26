
/**
 * Utility functions for checking if points are within path boundaries
 */

/**
 * Check if a point is inside a polygon using the ray casting algorithm
 */
export const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

/**
 * Check if a point is within a certain distance of a polyline
 */
export const isPointNearPolyline = (point: [number, number], polyline: [number, number][], tolerance: number = 0.001): boolean => {
  for (let i = 0; i < polyline.length - 1; i++) {
    const distance = distanceToLineSegment(point, polyline[i], polyline[i + 1]);
    if (distance <= tolerance) {
      return true;
    }
  }
  return false;
};

/**
 * Calculate distance from a point to a line segment
 */
const distanceToLineSegment = (point: [number, number], lineStart: [number, number], lineEnd: [number, number]): number => {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return Math.sqrt(A * A + B * B);
  }
  
  let param = dot / lenSq;
  
  if (param < 0) {
    param = 0;
  } else if (param > 1) {
    param = 1;
  }
  
  const xx = x1 + param * C;
  const yy = y1 + param * D;
  
  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Get all drawn paths from localStorage and check if a point is within any of them
 */
export const isPointWithinAnyDrawnPath = (point: [number, number]): boolean => {
  try {
    const savedDrawings = JSON.parse(localStorage.getItem('savedDrawings') || '[]');
    
    for (const drawing of savedDrawings) {
      if (drawing.coordinates && drawing.coordinates.length > 0) {
        // For polygons (rectangles, circles converted to polygons, etc.)
        if (drawing.type === 'rectangle' || drawing.type === 'polygon' || drawing.type === 'circle') {
          if (isPointInPolygon(point, drawing.coordinates)) {
            return true;
          }
        }
        // For polylines with tolerance
        else if (drawing.type === 'polyline') {
          if (isPointNearPolyline(point, drawing.coordinates, 0.0005)) {
            return true;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking point within drawn paths:', error);
    return true; // Allow movement if there's an error
  }
};

/**
 * Find the closest point within the drawn paths when a marker is dragged outside
 */
export const getClosestPointWithinPaths = (point: [number, number]): [number, number] => {
  try {
    const savedDrawings = JSON.parse(localStorage.getItem('savedDrawings') || '[]');
    let closestPoint = point;
    let minDistance = Infinity;
    
    for (const drawing of savedDrawings) {
      if (drawing.coordinates && drawing.coordinates.length > 0) {
        // Find closest point on the path boundary
        for (let i = 0; i < drawing.coordinates.length; i++) {
          const pathPoint = drawing.coordinates[i];
          const distance = Math.sqrt(
            Math.pow(point[0] - pathPoint[0], 2) + 
            Math.pow(point[1] - pathPoint[1], 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = pathPoint;
          }
        }
      }
    }
    
    return closestPoint;
  } catch (error) {
    console.error('Error finding closest point within paths:', error);
    return point;
  }
};
