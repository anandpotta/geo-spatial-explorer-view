
import L from 'leaflet';

/**
 * Extract all SVG paths from the map's overlay pane
 */
export function extractSvgPaths(map: L.Map): SVGPathElement[] {
  if (!map) return [];
  
  try {
    // Get the overlay pane which contains the SVG elements
    const container = map.getContainer();
    if (!container) return [];
    
    const overlayPane = container.querySelector('.leaflet-overlay-pane');
    if (!overlayPane) return [];
    
    // Get all path elements
    return Array.from(overlayPane.querySelectorAll('path')) as SVGPathElement[];
  } catch (err) {
    console.error('Error extracting SVG paths:', err);
    return [];
  }
}
