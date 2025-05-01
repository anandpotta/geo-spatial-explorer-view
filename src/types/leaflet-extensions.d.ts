
// Type extensions for Leaflet to support editing capabilities
import L from 'leaflet';

declare module 'leaflet' {
  interface LayerOptions {
    renderer?: L.Renderer;
    fillOpacity?: number;
    opacity?: number;
    weight?: number;
    color?: string;
    interactive?: boolean;
  }
  
  interface PathOptions {
    fillPattern?: {
      url: string;
      pattern: boolean;
    };
    renderer?: L.Renderer;
    fillOpacity?: number;
    opacity?: number;
    weight?: number;
    color?: string;
    interactive?: boolean;
  }
  
  interface Layer {
    editing?: L.Handler & {
      enable?: () => void;
      disable?: () => void;
    };
    _path?: SVGElement; // Internal Leaflet property for the SVG element
    _updatePath?: () => void; // Internal method to update SVG path
    _renderer?: any; // Renderer instance
    options?: LayerOptions | PathOptions;
    _map?: L.Map;
    getLatLng?: () => L.LatLng;
    getLatLngs?: () => L.LatLng[] | L.LatLng[][] | L.LatLng[][][];
    getRadius?: () => number;
    toGeoJSON?: () => any;
  }
  
  interface Path {
    _path?: SVGElement; // Internal Leaflet property for the SVG element
    _updatePath?: () => void; // Internal method to update SVG path
    _renderer?: any; // Renderer instance
    options?: PathOptions;
  }
  
  namespace Handler {
    class PolyEdit extends L.Handler {
      constructor(poly: L.Path);
      enable(): void;
      disable(): void;
    }
  }
}
