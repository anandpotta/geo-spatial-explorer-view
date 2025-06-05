
export interface GeoLocation {
  id: string;
  x: number; // longitude
  y: number; // latitude
  label: string;
  z?: number; // altitude
}

export interface MapOptions {
  zoom?: number;
  center?: { lat: number; lng: number };
  tileProvider?: string;
  showControls?: boolean;
}

export interface GeoSpatialExplorerProps {
  selectedLocation?: GeoLocation;
  onLocationSelect?: (location: GeoLocation) => void;
  onMapReady?: () => void;
  currentView?: 'cesium' | 'leaflet';
  mapOptions?: MapOptions;
}
