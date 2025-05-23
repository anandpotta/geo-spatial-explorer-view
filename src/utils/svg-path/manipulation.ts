
import L from 'leaflet';
import { deserializeSvgPath } from './serialization';

/**
 * Add an SVG path to the map
 */
export function addSvgPathToMap(map: L.Map, pathElement: SVGPathElement): void {
  if (!map || !pathElement) return;
  
  try {
    const container = map.getContainer();
    if (!container) return;
    
    const overlayPane = container.querySelector('.leaflet-overlay-pane');
    if (!overlayPane) return;
    
    // Find or create an SVG element
    let svg = overlayPane.querySelector('svg');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('pointer-events', 'none');
      svg.setAttribute('class', 'leaflet-zoom-animated');
      overlayPane.appendChild(svg);
    }
    
    // Find or create a group element
    let g = svg.querySelector('g');
    if (!g) {
      g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      svg.appendChild(g);
    }
    
    // Add the path to the group
    g.appendChild(pathElement);
    
  } catch (err) {
    console.error('Error adding SVG path to map:', err);
  }
}

/**
 * Restore SVG paths from serialized data
 */
export function restoreSvgPaths(map: L.Map, serializedPaths: string[]): void {
  if (!map || !serializedPaths || !serializedPaths.length) return;
  
  try {
    serializedPaths.forEach(serializedPath => {
      const path = deserializeSvgPath(serializedPath);
      if (path) {
        addSvgPathToMap(map, path);
      }
    });
  } catch (err) {
    console.error('Error restoring SVG paths:', err);
  }
}
