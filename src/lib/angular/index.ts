
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

// Primary exports with consistent naming
export { AngularMapComponent };
export { AngularGlobeComponent };
export { GeospatialExplorerModule };

// Additional aliases for easier usage
export { AngularMapComponent as GeoMapComponent };
export { AngularGlobeComponent as GeoGlobeComponent };

// Default export for easier importing
export { GeospatialExplorerModule as default };

// Core types re-exported for convenience
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions
} from '../geospatial-core/types';

// Simple DrawingData interface without dependencies
export interface DrawingData {
  id: string;
  type: string;
  data: any;
}

// Platform-specific utilities
export const isAngular = hasAngular;
export const isWeb = true;
export const isReactNative = false;
export const isReact = false;

// Angular-specific drawing utilities (simplified interface)
export interface AngularDrawingService {
  handleFileUpload: (drawingId: string, file: File) => void;
  handleShapeCreation: (shape: any) => void;
  setupEventHandlers: (element: Element) => void;
}

// Legacy exports for backwards compatibility
export const MapComponent = AngularMapComponent;
export const GlobeComponent = AngularGlobeComponent;
export const MapComponentAngular = AngularMapComponent;

// Public API for Angular applications
export const GEOSPATIAL_EXPLORER_MODULE = GeospatialExplorerModule;
export const GEO_MAP_COMPONENT = AngularMapComponent;
export const GEO_GLOBE_COMPONENT = AngularGlobeComponent;
