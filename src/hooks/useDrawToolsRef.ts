
import { useImperativeHandle, RefObject } from 'react';
import L from 'leaflet';
import { getMapFromLayer } from '@/utils/leaflet';

export const useDrawToolsRef = (
  ref: React.ForwardedRef<any>, 
  editControlRef: RefObject<any>,
  featureGroup: L.FeatureGroup
) => {
  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
    getPathElements: () => {
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
    },
    getSVGPathData: () => {
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
    }
  }));
};
