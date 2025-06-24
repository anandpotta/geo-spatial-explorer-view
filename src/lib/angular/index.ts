
// Angular module and components
export { AngularMapComponent } from './map.component';
export { AngularGlobeComponent } from './globe.component';
export { GeospatialExplorerModule } from './geospatial-explorer.module';

// Core types re-exported for convenience
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions
} from '../geospatial-core/types';

// Platform info
export const isAngular = true;
export const isWeb = true;
export const isReactNative = false;
export const isReact = false;
