
import L from 'leaflet';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';

/**
 * Hook to provide methods for accessing SVG path elements
 */
export function usePathElements(featureGroup: L.FeatureGroup) {
  /**
   * Get all path elements in the map
   */
  const getPathElements = (): SVGPathElement[] => {
    const pathElements: SVGPathElement[] = [];
    // Find all SVG paths within the map container
    if (featureGroup) {
      const map = getMapFromLayer(featureGroup);
      if (map) {
        const container = map.getContainer();
        if (container) {
          const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg');
          svgElements.forEach(svg => {
            const paths = svg.querySelectorAll('path.leaflet-interactive');
            paths.forEach(path => {
              pathElements.push(path as SVGPathElement);
            });
          });
        }
      }
    }
    return pathElements;
  };

  /**
   * Get path data from all SVG paths in the map
   */
  const getSVGPathData = (): string[] => {
    const pathData: string[] = [];
    // Find all SVG paths within the map container
    if (featureGroup) {
      const map = getMapFromLayer(featureGroup);
      if (map) {
        const container = map.getContainer();
        if (container) {
          const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg');
          svgElements.forEach(svg => {
            const paths = svg.querySelectorAll('path.leaflet-interactive');
            paths.forEach(path => {
              const d = path.getAttribute('d');
              if (d) {
                pathData.push(d);
              }
            });
          });
        }
      }
    }
    return pathData;
  };

  /**
   * Clear all path elements in the map
   */
  const clearPathElements = (): void => {
    if (featureGroup) {
      const map = getMapFromLayer(featureGroup);
      if (map) {
        const container = map.getContainer();
        if (container) {
          const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg');
          svgElements.forEach(svg => {
            // Clear out all paths
            svg.querySelectorAll('path.leaflet-interactive').forEach(path => {
              path.remove();
            });
            
            // Also clear any clip paths or images
            svg.querySelectorAll('clipPath, image').forEach(el => {
              el.remove();
            });
          });
        }
      }
    }
  };

  // Return all the functions
  return {
    getPathElements,
    getSVGPathData,
    clearPathElements
  };
}
