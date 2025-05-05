
import { useRef, useImperativeHandle, RefObject, ForwardedRef } from 'react';
import L from 'leaflet';

/**
 * Hook to provide path element access methods and refs
 */
export function useDrawToolHandler(ref: ForwardedRef<any>) {
  const drawToolsRef = useRef<any>(null);
  
  /**
   * Get all path elements in the map
   */
  const getPathElements = (): SVGPathElement[] => {
    const pathElements: SVGPathElement[] = [];
    // Find all SVG paths within the map container
    if (drawToolsRef.current && drawToolsRef.current.featureGroup) {
      const featureGroup = drawToolsRef.current.featureGroup;
      const map = (featureGroup as any)._map;
      if (map) {
        const container = map.getContainer();
        if (container) {
          // Look more broadly for paths in all leaflet panes
          const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg');
          svgElements.forEach(svg => {
            const paths = svg.querySelectorAll('path.leaflet-interactive');
            paths.forEach(path => {
              pathElements.push(path as SVGPathElement);
              
              // Ensure visibility by adding class if missing
              if (!path.classList.contains('visible-path-stroke')) {
                path.classList.add('visible-path-stroke');
              }
              
              // Force visibility through inline style as well
              path.setAttribute('stroke-width', '4px');
              path.setAttribute('stroke-opacity', '1');
              path.setAttribute('fill-opacity', '0.3');
              path.setAttribute('visibility', 'visible');
              path.setAttribute('display', 'block');
              
              // Force a reflow to ensure styles are applied
              path.getBoundingClientRect();
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
    if (drawToolsRef.current && drawToolsRef.current.featureGroup) {
      const featureGroup = drawToolsRef.current.featureGroup;
      const map = (featureGroup as any)._map;
      if (map) {
        const container = map.getContainer();
        if (container) {
          // Look more broadly for paths in all leaflet panes
          const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg');
          svgElements.forEach(svg => {
            const paths = svg.querySelectorAll('path.leaflet-interactive');
            paths.forEach(path => {
              const d = path.getAttribute('d');
              if (d) {
                pathData.push(d);
                
                // Store the path data as an attribute for persistence
                path.setAttribute('data-original-path', d);
                
                // Ensure visibility
                if (!path.classList.contains('visible-path-stroke')) {
                  path.classList.add('visible-path-stroke');
                }
                
                // Apply direct styling attributes
                path.setAttribute('stroke', '#33C3F0');
                path.setAttribute('stroke-width', '4px');
                path.setAttribute('stroke-opacity', '1');
                path.setAttribute('fill-opacity', '0.3');
                path.setAttribute('visibility', 'visible');
                path.setAttribute('display', 'block');
              }
            });
          });
        }
      }
    }
    return pathData;
  };
  
  /**
   * Restores visibility to all paths in the feature group
   */
  const restorePathVisibility = (): void => {
    const paths = getPathElements();
    paths.forEach(path => {
      // Ensure path has visibility class
      if (!path.classList.contains('visible-path-stroke')) {
        path.classList.add('visible-path-stroke');
      }
      
      // Apply direct styling attributes for maximum visibility
      path.setAttribute('stroke', '#33C3F0');
      path.setAttribute('stroke-width', '4px');
      path.setAttribute('stroke-opacity', '1');
      path.setAttribute('fill-opacity', '0.3');
      path.setAttribute('visibility', 'visible');
      path.setAttribute('display', 'block');
      
      // Restore original path data if available
      const originalPath = path.getAttribute('data-original-path');
      if (originalPath && path.getAttribute('d') !== originalPath) {
        path.setAttribute('d', originalPath);
      }
      
      // Force a reflow to ensure the browser renders the path
      path.getBoundingClientRect();
    });
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getPathElements,
    getSVGPathData,
    restorePathVisibility,
    featureGroup: drawToolsRef.current?.featureGroup
  }));

  return {
    drawToolsRef,
    getPathElements,
    getSVGPathData,
    restorePathVisibility
  };
}
