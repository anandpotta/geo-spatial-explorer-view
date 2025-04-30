
// Type extensions for Leaflet to support editing capabilities
import L from 'leaflet';

declare module 'leaflet' {
  interface Path {
    editing?: L.Handler;
  }
  
  namespace Handler {
    class PolyEdit extends L.Handler {
      constructor(poly: L.Path);
    }
  }
}
