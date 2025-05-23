// This file contains utility functions for working with SVG paths in the map

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

/**
 * Clear all SVG elements from the map's overlay pane
 * This is a more aggressive approach than just using clearLayers() 
 * as it directly removes elements from the DOM
 */
export function clearAllMapSvgElements(map: L.Map): void {
  if (!map) return;
  
  console.log('Clearing all SVG elements from map');
  
  try {
    // Get the container and overlay pane
    const container = map.getContainer();
    if (!container) return;
    
    // Clear SVG elements from overlay pane
    const overlayPane = container.querySelector('.leaflet-overlay-pane');
    if (overlayPane) {
      // Find all SVGs in the overlay pane
      const svgElements = Array.from(overlayPane.querySelectorAll('svg'));
      
      svgElements.forEach(svg => {
        // Remove all path elements within each SVG
        const paths = Array.from(svg.querySelectorAll('path'));
        paths.forEach(path => {
          path.remove();
        });
        
        // Clean up empty g elements
        const gElements = Array.from(svg.querySelectorAll('g'));
        gElements.forEach(g => {
          if (!g.hasChildNodes()) {
            g.remove();
          }
        });
        
        // If the SVG is now empty (no child nodes), remove it
        if (!svg.hasChildNodes()) {
          svg.remove();
        }
      });
    }
    
    // Also check the marker pane for any remnant elements
    const markerPane = container.querySelector('.leaflet-marker-pane');
    if (markerPane) {
      // Keep removing first child until pane is empty
      while (markerPane.firstChild) {
        markerPane.removeChild(markerPane.firstChild);
      }
    }
    
    // Force a rerender of the map
    if (typeof map.invalidateSize === 'function') {
      map.invalidateSize();
    }
    
    console.log('Completed SVG element cleanup');
  } catch (err) {
    console.error('Error clearing SVG elements:', err);
  }
}

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
