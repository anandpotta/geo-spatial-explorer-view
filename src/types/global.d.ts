
declare global {
  interface Window {
    featureGroup?: L.FeatureGroup;
    preventMapClick?: boolean;
    leafletMap?: L.Map;
  }
}

export {};
