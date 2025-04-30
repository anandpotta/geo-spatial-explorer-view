
import L from 'leaflet';

/**
 * Overrides Leaflet's circle and rectangle rendering to force SVG path creation
 */
export function setupSvgPathRendering(): () => void {
  // Override Circle initialization to always use SVG renderer
  const originalCircleInitialize = (L.Circle as any).prototype.initialize;
  const originalCircleRedraw = (L.Circle as any).prototype._updatePath;
  
  (L.Circle as any).prototype.initialize = function(...args: any[]) {
    if (!args[1]?.renderer) {
      if (!args[1]) args[1] = {};
      args[1].renderer = L.svg();
    }
    return originalCircleInitialize.apply(this, args);
  };
  
  // Ensure circle redraws properly generate SVG paths
  (L.Circle as any).prototype._updatePath = function() {
    originalCircleRedraw.call(this);
    if (this._path && !this._path.getAttribute('d')) {
      const d = this._renderer._curvePointsToPath([this._point]);
      if (d) this._path.setAttribute('d', d);
    }
  };
  
  // Do the same for Rectangle
  const originalRectInitialize = (L.Rectangle as any).prototype.initialize;
  
  (L.Rectangle as any).prototype.initialize = function(...args: any[]) {
    if (!args[1]?.renderer) {
      if (!args[1]) args[1] = {};
      args[1].renderer = L.svg();
    }
    return originalRectInitialize.apply(this, args);
  };
  
  // Return a cleanup function
  return () => {
    // Restore original functions when component unmounts
    (L.Circle as any).prototype.initialize = originalCircleInitialize;
    (L.Circle as any).prototype._updatePath = originalCircleRedraw;
    (L.Rectangle as any).prototype.initialize = originalRectInitialize;
  };
}

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
        const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg');
        svgElements.forEach(svg => {
          const paths = svg.querySelectorAll('path');
          paths.forEach(path => {
            pathElements.push(path as SVGPathElement);
          });
        });
      }
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
    // Find all SVG paths within the map container
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
  } catch (err) {
    console.error('Error getting SVG path data:', err);
  }
  
  return pathData;
}

/**
 * Helper to get map from layer
 */
function getMapFromLayer(layer: L.Layer): L.Map | null {
  if (!layer) return null;
  
  // Try the _map property first (most common)
  if ((layer as any)._map) {
    return (layer as any)._map;
  }
  
  // For feature groups, try to get the map from the first layer
  if ('getLayers' in layer && typeof (layer as any).getLayers === 'function') {
    const layers = (layer as any).getLayers();
    if (layers.length > 0 && layers[0]._map) {
      return layers[0]._map;
    }
  }
  
  return null;
}
