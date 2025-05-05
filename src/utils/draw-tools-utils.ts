
import L from 'leaflet';

/**
 * Add drawing ID to SVG path element
 */
export const addDrawingIdToPath = (path: SVGPathElement | null, drawingId: string): void => {
  if (path && drawingId) {
    path.setAttribute('data-drawing-id', drawingId);
    
    // Remove fill-opacity for elements with clip masks
    if (path.getAttribute('data-has-clip-mask') === 'true') {
      path.removeAttribute('fill-opacity');
    }
  }
};

/**
 * Configure SVG renderer for all paths
 */
export const configureSvgRenderer = (): () => void => {
  // Instead of trying to modify the read-only property, configure the renderer
  // when creating layers
  const pathPrototype = L.Path.prototype as any; // Cast to any to access internal methods
  const originalUpdatePath = pathPrototype._updatePath;
  
  pathPrototype._updatePath = function() {
    if (this.options && !this.options.renderer) {
      this.options.renderer = L.svg();
    }
    originalUpdatePath.call(this);
    
    // Add drawing ID to path element if available
    if (this._path && this.drawingId) {
      this._path.setAttribute('data-drawing-id', this.drawingId);
      
      // Also set specific fill-opacity for elements with images
      if (this._path.getAttribute('data-has-clip-mask') === 'true') {
        this._path.removeAttribute('fill-opacity');
      }
    }
  };
  
  return () => {
    // Restore original function when component unmounts
    pathPrototype._updatePath = originalUpdatePath;
  };
};
