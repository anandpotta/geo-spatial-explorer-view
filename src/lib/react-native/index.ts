
export { GlobeComponent } from './GlobeComponent';
export { MapComponent, MapComponent as default } from './MapComponent';

// Core types re-exported for convenience
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions
} from '../geospatial-core/types';

// Platform-specific utilities
export const isReactNative = true;
export const isWeb = false;
