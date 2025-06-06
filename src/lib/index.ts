
// Main library entry point

// Core exports - these are the fundamental classes
export * from './geospatial-core';

// Platform-specific exports with proper namespacing
export * as ReactComponents from './react';
export * as ReactNativeComponents from './react-native';
export * as AngularComponents from './angular';

// Utility exports
export { 
  cn, 
  isWeb, 
  isReactNative, 
  formatCoordinate,
  calculateDistance
} from './utils';

// Re-export core types for easier consumption
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions,
  GlobeEventHandlers
} from './geospatial-core/types';
