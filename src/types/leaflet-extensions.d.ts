
// Type extensions for Leaflet to support editing capabilities
import L from 'leaflet';

declare module 'leaflet' {
  interface PathOptions {
    fillPattern?: {
      url: string;
      pattern: boolean;
    };
  }
  
  interface Path {
    editing?: L.Handler;
    _path?: SVGElement; // Internal Leaflet property for the SVG element
    _updatePath?: () => void; // Internal method to update SVG path
    _renderer?: any; // Renderer instance
  }
  
  namespace Handler {
    class PolyEdit extends L.Handler {
      constructor(poly: L.Path);
    }
  }
}
