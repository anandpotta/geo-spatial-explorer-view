
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

/**
 * GeoSpatial Explorer Library
 * 
 * A cross-platform library for geospatial visualization that works across:
 * - React Web applications
 * - React Native mobile applications
 * - Angular applications
 * 
 * This library provides consistent interfaces for:
 * - 3D interactive globes
 * - 2D interactive maps
 * - Location handling and management
 * - Geospatial calculations and utilities
 */
