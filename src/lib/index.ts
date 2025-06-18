
// Main library entry point

// Core exports - these are the fundamental classes
export * from './geospatial-core';

// Platform-specific exports with proper namespacing
export * as ReactComponents from './react';
export * as ReactNativeComponents from './react-native';

// Angular exports with error handling for non-Angular environments
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

// Angular-specific exports with conditional loading
let GeospatialExplorerModule: any = null;
let AngularMapComponent: any = null;
let AngularGlobeComponent: any = null;

try {
  const angularExports = require('./angular');
  GeospatialExplorerModule = angularExports.GeospatialExplorerModule;
  AngularMapComponent = angularExports.AngularMapComponent;
  AngularGlobeComponent = angularExports.AngularGlobeComponent;
} catch (error) {
  // Angular not available - this is expected in non-Angular environments
}

export { GeospatialExplorerModule, AngularMapComponent, AngularGlobeComponent };

// Main GeospatialExplorer export for Angular compatibility
export const GeospatialExplorer = GeospatialExplorerModule;

// Drawing hooks and utilities for React
export { useDrawingFileUpload } from '../hooks/useDrawingFileUpload';
export { useHandleShapeCreation } from '../hooks/useHandleShapeCreation';

// Version info
export const VERSION = '0.1.5';
export const PACKAGE_NAME = 'geospatial-explorer-lib';
