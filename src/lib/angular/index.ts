
export { MapComponentAngular } from './map.component';
export { GlobeComponent } from './globe.component';

// Core types re-exported for convenience
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions
} from '../geospatial-core/types';

// Platform-specific utilities
export const isAngular = true;
export const isWeb = true;
export const isReactNative = false;
