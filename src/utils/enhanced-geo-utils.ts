
// Enhanced types for standalone usage
export interface EnhancedLocation {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
  searchString?: string; // Original search term used to find this location
  timestamp?: string; // When this location was selected
  source?: 'internal' | 'external'; // How this location was selected
  raw?: any;
}

export interface StandaloneGeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: {
    id: string;
    name?: string;
    type: 'marker' | 'drawing';
    searchLocation?: {
      latitude: number;
      longitude: number;
      searchString?: string;
      timestamp?: string;
    };
    createdAt?: string;
    [key: string]: any;
  };
}

export interface StandaloneGeoJSON {
  type: 'FeatureCollection';
  features: StandaloneGeoJSONFeature[];
  metadata?: {
    searchLocation?: {
      latitude: number;
      longitude: number;
      searchString?: string;
      timestamp?: string;
    };
    exportedAt: string;
    totalFeatures: number;
  };
}
