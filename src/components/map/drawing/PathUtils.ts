
import L from 'leaflet';

/**
 * Overrides Leaflet's circle and rectangle rendering to force SVG path creation
 */
export function setupSvgPathRendering(): () => void {
  // Override Circle initialization to always use SVG renderer
  const originalCircleInitialize = (L.Circle as any).prototype.initialize;
  const originalCircleRedraw = (L.Circle as any).prototype._updatePath;
  
  (L.Circle as any).prototype.initialize = function(...args: any[]) {
    // Make sure we're only modifying an object, not a number parameter
    if (args.length >= 2) {
      // For Circle, args[0] is latlng, args[1] is options OR radius
      if (typeof args[1] === 'object') {
        // If second param is options, ensure renderer is set
        if (!args[1].renderer) {
          args[1].renderer = L.svg();
        }
      } else if (typeof args[1] === 'number' && args.length >= 3 && !args[2]) {
        // In some cases, args[1] is radius and args[2] is options
        // If options doesn't exist, create it
        args[2] = { renderer: L.svg() };
      } else if (typeof args[1] === 'number' && args.length >= 3 && typeof args[2] === 'object') {
        // If options exists, ensure renderer is set
        if (!args[2].renderer) {
          args[2].renderer = L.svg();
        }
      }
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
  
  // Override Polygon initialization too
  const originalPolygonInitialize = (L.Polygon as any).prototype.initialize;
  (L.Polygon as any).prototype.initialize = function(...args: any[]) {
    if (args.length >= 2 && typeof args[1] === 'object') {
      if (!args[1].renderer) {
        args[1].renderer = L.svg();
      }
    }
    return originalPolygonInitialize.apply(this, args);
  };
  
  // Do the same for Rectangle
  const originalRectInitialize = (L.Rectangle as any).prototype.initialize;
  
  (L.Rectangle as any).prototype.initialize = function(...args: any[]) {
    if (args.length >= 2 && typeof args[1] === 'object') {
      if (!args[1].renderer) {
        args[1].renderer = L.svg();
      }
    }
    return originalRectInitialize.apply(this, args);
  };
  
  // Return a cleanup function
  return () => {
    // Restore original functions when component unmounts
    (L.Circle as any).prototype.initialize = originalCircleInitialize;
    (L.Circle as any).prototype._updatePath = originalCircleRedraw;
    (L.Rectangle as any).prototype.initialize = originalRectInitialize;
    (L.Polygon as any).prototype.initialize = originalPolygonInitialize;
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

/**
 * Force SVG path creation for a layer
 */
export function forceSvgPathCreation(layer: L.Layer): void {
  if (!layer) return;
  
  try {
    // Ensure layer has SVG renderer
    if ((layer as any).options) {
      (layer as any).options.renderer = L.svg();
    }
    
    // Force update path if applicable
    if (typeof (layer as any)._updatePath === 'function') {
      (layer as any)._updatePath();
    }
    
    // For feature groups, apply to each layer
    if (typeof (layer as any).eachLayer === 'function') {
      (layer as any).eachLayer((subLayer: any) => {
        if (subLayer.options) {
          subLayer.options.renderer = L.svg();
        }
        
        if (typeof subLayer._updatePath === 'function') {
          subLayer._updatePath();
        }
      });
    }
  } catch (err) {
    console.error('Error forcing SVG path creation:', err);
  }
}
