
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
    }
  }
}

export {};
