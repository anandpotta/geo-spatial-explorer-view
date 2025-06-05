
// Main library entry point

// Core exports
export * from './geospatial-core';

// React-specific exports
import * as ReactComponents from './react';
export { ReactComponents };

// React Native specific exports
import * as ReactNativeComponents from './react-native';
export { ReactNativeComponents };

// Angular-specific exports
import * as AngularComponents from './angular';
export { AngularComponents };

// Re-export utils separately to avoid naming conflicts
import { calculateDistance } from './utils';
export { 
  cn, 
  isWeb, 
  isReactNative, 
  formatCoordinate,
  calculateDistance as calculateDistanceUtil 
} from './utils';
