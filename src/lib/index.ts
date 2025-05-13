
// Main library entry point

// Core exports
export * from './geospatial-core';

// React-specific exports
import * as ReactComponents from './react';
export { ReactComponents };

// React Native specific exports
import * as ReactNativeComponents from './react-native';
export { ReactNativeComponents };

// Angular-specific exports would be in a separate package

export * from './utils';
