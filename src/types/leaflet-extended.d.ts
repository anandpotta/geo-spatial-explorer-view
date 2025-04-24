
import L from 'leaflet';

declare module 'leaflet' {
  interface Map {
    // Add the internal properties we need access to
    _panes?: any;
    _layers?: {[key: string]: any};
    _initPathRoot?: () => void;
  }
}
