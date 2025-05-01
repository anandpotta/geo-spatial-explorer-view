
import L from 'leaflet';

/**
 * Generates an SVG path string from coordinates as a fallback
 */
export function generateSvgPathFromCoordinates(coordinates: [number, number][], layer: L.Layer): string | null {
  if (!coordinates || coordinates.length < 3) return null;
  
  try {
    // Get the map and its bounds for projection
    const map = (layer as any)._map;
    if (!map) return null;
    
    // Convert geographic coordinates to pixel coordinates
    const pixelPoints = coordinates.map(coord => {
      const point = map.latLngToLayerPoint(L.latLng(coord[0], coord[1]));
      return [point.x, point.y];
    });
    
    // Create the SVG path string
    let pathString = `M ${pixelPoints[0][0]},${pixelPoints[0][1]}`;
    for (let i = 1; i < pixelPoints.length; i++) {
      pathString += ` L ${pixelPoints[i][0]},${pixelPoints[i][1]}`;
    }
    pathString += ' Z'; // Close the path
    
    return pathString;
  } catch (err) {
    console.error('Error generating SVG path from coordinates:', err);
    return null;
  }
}
