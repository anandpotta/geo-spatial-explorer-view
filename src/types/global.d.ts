
declare global {
  interface Window {
    featureGroup?: L.FeatureGroup;
  }
  
  // Extend Leaflet Map type to include internal properties we access
  namespace L {
    interface Map {
      _isDestroyed?: boolean;
      _panes?: {
        mapPane?: {
          _leaflet_pos?: any;
        };
      };
      _leaflet_id?: number;
      _mapPane?: any;
      _layers?: {[key: string]: L.Layer};
    }
  }

  // Add _leaflet_id to HTMLElement for Leaflet
  interface HTMLElement {
    _leaflet_id?: number;
  }
}

export {};
