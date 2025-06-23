
// Angular module and components for Angular environments only
// Import components conditionally
let AngularMapComponent: any, AngularGlobeComponent: any, GeospatialExplorerModule: any;

let hasAngular = false;
try {
  // Check if Angular is available
  require('@angular/core');
  hasAngular = true;
  
  const mapComponent = require('./map.component');
  const globeComponent = require('./globe.component');
  const module = require('./geospatial-explorer.module');
  
  AngularMapComponent = mapComponent.AngularMapComponent;
  AngularGlobeComponent = globeComponent.AngularGlobeComponent;
  GeospatialExplorerModule = module.GeospatialExplorerModule;
} catch (error) {
  // Angular not available - create stub exports
  AngularMapComponent = class {
    static ɵcmp = {};
    static ɵfac = () => {};
  };
  AngularGlobeComponent = class {
    static ɵcmp = {};
    static ɵfac = () => {};
  };
  GeospatialExplorerModule = class {
    static forRoot() {
      return {
        ngModule: GeospatialExplorerModule,
        providers: []
      };
    }
  };
}

// Primary exports
export { AngularMapComponent };
export { AngularGlobeComponent };
export { GeospatialExplorerModule };

// Default export for easier importing
export { GeospatialExplorerModule as default };

// Core types re-exported for convenience
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions
} from '../geospatial-core/types';

// Drawing types for Angular
export type { DrawingData } from '../../utils/drawing-utils';

// Platform-specific utilities
export const isAngular = hasAngular;
export const isWeb = true;
export const isReactNative = false;
export const isReact = false;

// Angular-specific drawing utilities (would be implemented as services)
export interface AngularDrawingService {
  handleFileUpload: (drawingId: string, file: File) => void;
  handleShapeCreation: (shape: any) => void;
  setupEventHandlers: (element: Element) => void;
}

// Legacy exports for backwards compatibility
export const MapComponentAngular = AngularMapComponent;
export const GlobeComponent = AngularGlobeComponent;

// Public API for Angular applications
export const GEOSPATIAL_EXPLORER_MODULE = GeospatialExplorerModule;
export const GEO_MAP_COMPONENT = AngularMapComponent;
export const GEO_GLOBE_COMPONENT = AngularGlobeComponent;
