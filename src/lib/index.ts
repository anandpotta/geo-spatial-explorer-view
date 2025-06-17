
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

// Drawing-related type exports
export type {
  DrawingData
} from '../utils/drawing-utils';

// Default exports for easy importing
export { StandaloneMapComponent as MapComponent } from './react/StandaloneMapComponent';
export { GlobeComponent } from './react/GlobeComponent';

// Drawing hooks and utilities for React
export { useDrawingFileUpload } from '../hooks/useDrawingFileUpload';
export { useHandleShapeCreation } from '../hooks/useHandleShapeCreation';

// Version info
export const VERSION = '0.1.4';
export const PACKAGE_NAME = 'geospatial-explorer-lib';
