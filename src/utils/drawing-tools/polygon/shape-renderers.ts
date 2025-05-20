
import L from 'leaflet';

/**
 * Configures shape renderers for Circle, Polygon and other drawing tools
 */
export const configureShapeRenderers = (): () => void => {
  const cleanups: Array<() => void> = [];
  
  // Force SVG renderer for Circle
  if ((L.Draw as any).Circle) {
    const originalInitialize = (L.Draw as any).Circle.prototype.initialize;
    (L.Draw as any).Circle.prototype.initialize = function() {
      originalInitialize.apply(this, arguments);
      if (this.options && this.options.shapeOptions) {
        this.options.shapeOptions.renderer = L.svg();
      }
    };
    
    cleanups.push(() => {
      (L.Draw as any).Circle.prototype.initialize = originalInitialize;
    });
  }

  // Force SVG renderer for Polygon and improve visibility
  if ((L.Draw as any).Polygon) {
    const originalInitialize = (L.Draw as any).Polygon.prototype.initialize;
    (L.Draw as any).Polygon.prototype.initialize = function() {
      originalInitialize.apply(this, arguments);
      if (this.options && this.options.shapeOptions) {
        this.options.shapeOptions.renderer = L.svg(); // Force SVG renderer for polygons
        this.options.shapeOptions.weight = 4;
        this.options.shapeOptions.opacity = 1;
      }
      
      // Ensure guide line is clearly visible
      if (this.options) {
        this.options.guidelineDistance = 10;
        this.options.shapeOptions = this.options.shapeOptions || {};
        this.options.guidelineOptions = {
          color: '#33C3F0',
          weight: 2,
          opacity: 1,
          dashArray: '5, 5'
        };
      }
    };
    
    cleanups.push(() => {
      (L.Draw as any).Polygon.prototype.initialize = originalInitialize;
    });
  }
  
  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
};
