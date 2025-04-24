
import L from 'leaflet';

declare module 'leaflet' {
  interface Map {
    // Custom properties we're using on the map object
    hasMapClickHandler?: boolean;
    isMapFullyInitialized?: boolean;
    _panes?: any;
    _layers?: {[key: string]: any};
    _initPathRoot?: () => void;
  }
}
