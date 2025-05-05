
import L from 'leaflet';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';

/**
 * Hook to extract SVG path elements and data from a map
 */
export const useSvgPathElements = (featureGroup: L.FeatureGroup) => {
  /**
   * Get all SVG path elements within the map container
   */
  const getPathElements = (): SVGPathElement[] => {
    const pathElements: SVGPathElement[] = [];
    // Find all SVG paths within the map container
    if (featureGroup) {
      const map = getMapFromLayer(featureGroup);
      if (map) {
        const container = map.getContainer();
        if (container) {
          const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg');
          svgElements.forEach(svg => {
            const paths = svg.querySelectorAll('path');
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
   * Get all SVG path data attributes within the map container
   */
  const getSVGPathData = (): string[] => {
    const pathData: string[] = [];
    // Find all SVG paths within the map container
    if (featureGroup) {
      const map = getMapFromLayer(featureGroup);
      if (map) {
        const container = map.getContainer();
        if (container) {
          const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg');
          svgElements.forEach(svg => {
            const paths = svg.querySelectorAll('path');
            paths.forEach(path => {
              pathData.push(path.getAttribute('d') || '');
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
};
