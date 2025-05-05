
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
    
    // Skip if edit mode is activating
    if (window._editModeActivating) {
      console.log('Skipping getPathElements during edit mode activation');
      return pathElements;
    }
    
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
    
    // Skip if edit mode is activating
    if (window._editModeActivating) {
      console.log('Skipping getSVGPathData during edit mode activation');
      return pathData;
    }
    
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

  return {
    getPathElements,
    getSVGPathData
  };
}
