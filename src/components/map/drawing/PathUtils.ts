
import L from 'leaflet';

/**
 * Overrides Leaflet's circle and rectangle rendering to force SVG path creation
 */
export function setupSvgPathRendering(): () => void {
  // Override Circle initialization to always use SVG renderer
  const originalCircleInitialize = (L.Circle as any).prototype.initialize;
  const originalCircleRedraw = (L.Circle as any).prototype._updatePath;
  
  (L.Circle as any).prototype.initialize = function(...args: any[]) {
    // Safely call the original initialize method
    const result = originalCircleInitialize.apply(this, args);
    
    // After initialization, make sure the renderer is set to SVG
    if (this.options) {
      this.options.renderer = L.svg();
    } else {
      this.options = { renderer: L.svg() };
    }
    
    return result;
  };
  
  // Ensure circle redraws properly generate SVG paths
  (L.Circle as any).prototype._updatePath = function() {
    originalCircleRedraw.call(this);
    if (this._path && !this._path.getAttribute('d')) {
      try {
        const d = this._renderer._curvePointsToPath([this._point]);
        if (d) this._path.setAttribute('d', d);
      } catch (err) {
        console.error('Error setting path data for circle', err);
      }
    }
    // Ensure the path is visible
    if (this._path) {
      this._path.style.display = 'block';
      this._path.style.visibility = 'visible';
      this._path.style.opacity = '1';
      this._path.style.fillOpacity = '0.5';
    }
  };
  
  // Override Polygon initialization too
  const originalPolygonInitialize = (L.Polygon as any).prototype.initialize;
  (L.Polygon as any).prototype.initialize = function(...args: any[]) {
    // Force SVG renderer for all polygons
    if (args.length >= 2 && typeof args[1] === 'object') {
      if (!args[1].renderer) {
        args[1].renderer = L.svg();
      }
    } else if (args.length >= 1 && !this.options) {
      // If options aren't passed, add them
      this.options = { renderer: L.svg() };
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
    } else if (args.length >= 1 && !this.options) {
      // If options aren't passed, add them
      this.options = { renderer: L.svg() };
    }
    
    return originalRectInitialize.apply(this, args);
  };
  
  // Also override the updatePath method for Polygon and Rectangle
  const originalPolygonUpdatePath = (L.Polygon as any).prototype._updatePath;
  (L.Polygon as any).prototype._updatePath = function() {
    originalPolygonUpdatePath.call(this);
    // Ensure the path is visible
    if (this._path) {
      this._path.style.display = 'block';
      this._path.style.visibility = 'visible';
      this._path.style.opacity = '1';
      this._path.style.fillOpacity = '0.5';
    }
  };
  
  // Return a cleanup function
  return () => {
    // Restore original functions when component unmounts
    (L.Circle as any).prototype.initialize = originalCircleInitialize;
    (L.Circle as any).prototype._updatePath = originalCircleRedraw;
    (L.Rectangle as any).prototype.initialize = originalRectInitialize;
    (L.Polygon as any).prototype.initialize = originalPolygonInitialize;
    (L.Polygon as any).prototype._updatePath = originalPolygonUpdatePath;
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
      
      // Ensure visibility styles are set
      if ((layer as any).options) {
        (layer as any).options.fillOpacity = (layer as any).options.fillOpacity || 0.5;
        (layer as any).options.opacity = (layer as any).options.opacity || 1;
        (layer as any).options.weight = (layer as any).options.weight || 3;
      }
    }
    
    // Force update path if applicable
    if (typeof (layer as any)._updatePath === 'function') {
      (layer as any)._updatePath();
      
      // Also ensure path is visible after update
      if ((layer as any)._path) {
        (layer as any)._path.style.display = 'block';
        (layer as any)._path.style.visibility = 'visible';
        (layer as any)._path.style.opacity = '1';
        (layer as any)._path.style.fillOpacity = '0.5';
        (layer as any)._path.style.pointerEvents = 'auto';
      }
    }
    
    // For feature groups, apply to each layer
    if (typeof (layer as any).eachLayer === 'function') {
      (layer as any).eachLayer((subLayer: any) => {
        if (subLayer.options) {
          subLayer.options.renderer = L.svg();
          subLayer.options.fillOpacity = subLayer.options.fillOpacity || 0.5;
          subLayer.options.opacity = subLayer.options.opacity || 1;
          subLayer.options.weight = subLayer.options.weight || 3;
        }
        
        if (typeof subLayer._updatePath === 'function') {
          subLayer._updatePath();
          
          // Also ensure path is visible after update
          if (subLayer._path) {
            subLayer._path.style.display = 'block';
            subLayer._path.style.visibility = 'visible';
            subLayer._path.style.opacity = '1';
            subLayer._path.style.fillOpacity = '0.5';
            subLayer._path.style.pointerEvents = 'auto';
          }
        }
      });
    }
    
    // If the layer is a circle, ensure it's properly displaying
    if ((layer as any).getRadius && (layer as any)._path) {
      const path = (layer as any)._path;
      path.style.display = 'block';
      path.style.visibility = 'visible';
      path.style.opacity = '1';
      path.style.fillOpacity = '0.5';
      path.style.pointerEvents = 'auto';
    }
  } catch (err) {
    console.error('Error forcing SVG path creation:', err);
  }
}

/**
 * Make a layer visible by ensuring its style attributes are correct
 */
export function ensureLayerVisibility(layer: L.Layer): void {
  try {
    // Direct path access
    if ((layer as any)._path) {
      const path = (layer as any)._path;
      path.style.display = 'block';
      path.style.visibility = 'visible';
      path.style.opacity = '1';
      path.style.fillOpacity = '0.5';
      path.style.pointerEvents = 'auto';
    }
    
    // For feature groups
    if (typeof (layer as any).eachLayer === 'function') {
      (layer as any).eachLayer((subLayer: any) => {
        if (subLayer._path) {
          const path = subLayer._path;
          path.style.display = 'block';
          path.style.visibility = 'visible';
          path.style.opacity = '1';
          path.style.fillOpacity = '0.5';
          path.style.pointerEvents = 'auto';
        }
      });
    }
  } catch (err) {
    console.error('Error ensuring layer visibility:', err);
  }
}
