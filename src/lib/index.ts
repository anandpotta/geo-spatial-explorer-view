
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

// Simple DrawingData interface without complex dependencies
export interface DrawingData {
  id: string;
  type: string;
  data: any;
}

// Default exports for easy importing
export { StandaloneMapComponent as MapComponent } from './react/StandaloneMapComponent';
export { GlobeComponent } from './react/GlobeComponent';

// Angular-specific exports with conditional loading and proper module structure
let GeospatialExplorerModule: any = null;
let AngularMapComponent: any = null;
let AngularGlobeComponent: any = null;

try {
  const angularExports = require('./angular');
  GeospatialExplorerModule = angularExports.GeospatialExplorerModule;
  AngularMapComponent = angularExports.AngularMapComponent;
  AngularGlobeComponent = angularExports.AngularGlobeComponent;
} catch (error) {
  // Angular not available - create proper stub components with Angular module structure
  const createStubModule = () => {
    class StubModule {
      static ɵmod = { 
        type: StubModule,
        declarations: [],
        imports: [],
        exports: []
      };
      static ɵinj = { 
        factory: function() { return new StubModule(); },
        providers: [],
        imports: []
      };
      static forRoot() {
        return {
          ngModule: StubModule,
          providers: []
        };
      }
    }
    return StubModule;
  };
  
  const createStubComponent = () => {
    class StubComponent {
      static ɵcmp = { 
        type: StubComponent, 
        selectors: [['stub']], 
        decls: 0, 
        vars: 0, 
        template: function() { return ''; },
        standalone: false
      };
      static ɵfac = function() { return new StubComponent(); };
    }
    return StubComponent;
  };
  
  GeospatialExplorerModule = createStubModule();
  AngularMapComponent = createStubComponent();
  AngularGlobeComponent = createStubComponent();
}

export { GeospatialExplorerModule, AngularMapComponent, AngularGlobeComponent };

// Main GeospatialExplorer export for Angular compatibility
export const GeospatialExplorer = GeospatialExplorerModule;

// Version info
export const VERSION = '0.1.7';
export const PACKAGE_NAME = 'geospatial-explorer-lib';

// Angular-specific re-exports for easier importing
export const ANGULAR_MAP_COMPONENT = AngularMapComponent;
export const ANGULAR_GLOBE_COMPONENT = AngularGlobeComponent;
export const GEOSPATIAL_MODULE = GeospatialExplorerModule;
