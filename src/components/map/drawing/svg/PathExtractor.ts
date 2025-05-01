
import L from 'leaflet';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';

/**
 * Get all SVG path elements from the map
 */
export function getPathElements(featureGroup: L.FeatureGroup): SVGPathElement[] {
  const pathElements: SVGPathElement[] = [];
  
  try {
    // Find all SVG paths within the map container
    const map = getMapFromLayer(featureGroup);
    if (map) {
      const container = map.getContainer();
      if (container) {
        const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane--vector-layer svg');
        svgElements.forEach(svg => {
          const paths = svg.querySelectorAll('path');
          paths.forEach(path => {
            pathElements.push(path as SVGPathElement);
          });
        });
      }
    }
    
    // If no paths found through container, try to get directly from layers
    if (pathElements.length === 0 && featureGroup) {
      featureGroup.eachLayer((layer: any) => {
        if (layer._path) {
          pathElements.push(layer._path);
        }
      });
    }
  } catch (err) {
    console.error('Error getting path elements:', err);
  }
  
  return pathElements;
}

/**
 * Get all SVG path data from the map
 */
export function getSVGPathData(featureGroup: L.FeatureGroup): string[] {
  const pathData: string[] = [];
  
  try {
    // Get path elements first
    const pathElements = getPathElements(featureGroup);
    
    // Extract path data from elements
    pathElements.forEach(path => {
      const data = path.getAttribute('d');
      if (data) {
        pathData.push(data);
        console.log('Found SVG path data:', data);
      }
    });
    
    // If no paths found through elements, try to get directly from layers
    if (pathData.length === 0 && featureGroup) {
      featureGroup.eachLayer((layer: any) => {
        if (layer._path) {
          const d = layer._path.getAttribute('d');
          if (d) {
            pathData.push(d);
            console.log('Found SVG path data from layer:', d);
          }
        }
      });
    }
  } catch (err) {
    console.error('Error getting SVG path data:', err);
  }
  
  return pathData;
}
