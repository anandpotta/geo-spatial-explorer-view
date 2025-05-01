
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
