
/**
 * Convert SVG path data to a format that can be stored and restored
 */
export function serializeSvgPath(path: SVGPathElement): string | null {
  if (!path) return null;
  
  try {
    const d = path.getAttribute('d');
    if (!d) return null;
    
    // Get style attributes
    const stroke = path.getAttribute('stroke') || '#3388ff';
    const strokeWidth = path.getAttribute('stroke-width') || '3';
    const strokeOpacity = path.getAttribute('stroke-opacity') || '1';
    const fill = path.getAttribute('fill') || '#3388ff';
    const fillOpacity = path.getAttribute('fill-opacity') || '0.2';
    const className = path.getAttribute('class') || '';
    
    // Create a serializable object
    const pathData = {
      id: path.id || `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      d,
      stroke,
      strokeWidth,
      strokeOpacity,
      fill,
      fillOpacity,
      className
    };
    
    return JSON.stringify(pathData);
  } catch (err) {
    console.error('Error serializing SVG path:', err);
    return null;
  }
}

/**
 * Create an SVG path element from serialized data
 */
export function deserializeSvgPath(serializedPath: string): SVGPathElement | null {
  if (!serializedPath) return null;
  
  try {
    const pathData = JSON.parse(serializedPath);
    if (!pathData || !pathData.d) return null;
    
    // Create a new path element
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Set attributes
    path.setAttribute('d', pathData.d);
    path.setAttribute('stroke', pathData.stroke || '#3388ff');
    path.setAttribute('stroke-width', pathData.strokeWidth || '3');
    path.setAttribute('stroke-opacity', pathData.strokeOpacity || '1');
    path.setAttribute('fill', pathData.fill || '#3388ff');
    path.setAttribute('fill-opacity', pathData.fillOpacity || '0.2');
    
    if (pathData.className) {
      path.setAttribute('class', pathData.className);
    }
    
    if (pathData.id) {
      path.id = pathData.id;
    }
    
    return path;
  } catch (err) {
    console.error('Error deserializing SVG path:', err);
    return null;
  }
}
