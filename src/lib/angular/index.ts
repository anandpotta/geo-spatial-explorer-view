
// Angular module and components - only available when Angular is installed
// These exports will only work in Angular projects with proper dependencies

let AngularMapComponent: any = null;
let AngularGlobeComponent: any = null;
let GeospatialExplorerModule: any = null;

try {
  // Dynamic imports that only work when @angular/core is available
  if (typeof window !== 'undefined' && (window as any).ng) {
    // Angular environment detected
    const { AngularMapComponent: MapComp } = require('./map.component');
    const { AngularGlobeComponent: GlobeComp } = require('./globe.component');
    const { GeospatialExplorerModule: Module } = require('./geospatial-explorer.module');
    
    AngularMapComponent = MapComp;
    AngularGlobeComponent = GlobeComp;
    GeospatialExplorerModule = Module;
  } else {
    // Try importing without window check for server-side rendering
    const { AngularMapComponent: MapComp } = require('./map.component');
    const { AngularGlobeComponent: GlobeComp } = require('./globe.component');
    const { GeospatialExplorerModule: Module } = require('./geospatial-explorer.module');
    
    AngularMapComponent = MapComp;
    AngularGlobeComponent = GlobeComp;
    GeospatialExplorerModule = Module;
  }
} catch (error) {
  // Angular dependencies not available - provide fallback exports
  console.warn('Angular dependencies not available. Angular components will not be functional.');
  
  // Provide minimal fallback implementations
  AngularMapComponent = class { };
  AngularGlobeComponent = class { };
  GeospatialExplorerModule = class { };
}

// Export with fallbacks for non-Angular environments
export { AngularMapComponent, AngularGlobeComponent, GeospatialExplorerModule };

// Default export for easier importing
export default GeospatialExplorerModule;

// Core types re-exported for convenience
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions
} from '../geospatial-core/types';

// Drawing types for Angular
export type { DrawingData } from '../../utils/drawing-utils';

// Platform-specific utilities
export const isAngular = true;
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
