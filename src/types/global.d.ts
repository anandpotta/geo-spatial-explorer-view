
declare global {
  interface Window {
    featureGroup?: L.FeatureGroup;
  }
  
  // Extend Leaflet Map type to include internal properties we access
  namespace L {
    interface Map {
      _isDestroyed?: boolean;
      _mapPane?: HTMLElement & {
        _leaflet_pos?: { x: number; y: number };
      };
      _leaflet_id?: number;
    }
  }
}

export {};
