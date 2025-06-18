
// Conditional Angular imports with fallbacks
let NgModule: any, CommonModule: any;
let AngularMapComponent: any, AngularGlobeComponent: any;

try {
  // Only import Angular dependencies if they're available
  if (typeof window !== 'undefined' && (window as any).ng) {
    const angular = require('@angular/core');
    const common = require('@angular/common');
    NgModule = angular.NgModule;
    CommonModule = common.CommonModule;
    
    // Import components only if Angular is available
    const mapComp = require('./map.component');
    const globeComp = require('./globe.component');
    AngularMapComponent = mapComp.AngularMapComponent;
    AngularGlobeComponent = globeComp.AngularGlobeComponent;
  }
} catch (error) {
  // Angular not available - provide mock implementations
  NgModule = () => () => {};
  CommonModule = {};
  AngularMapComponent = null;
  AngularGlobeComponent = null;
}

// Export with conditional decorator
export const GeospatialExplorerModule = NgModule && NgModule({
  declarations: [
    AngularMapComponent,
    AngularGlobeComponent
  ].filter(Boolean),
  imports: [
    CommonModule
  ].filter(Boolean),
  exports: [
    AngularMapComponent,
    AngularGlobeComponent
  ].filter(Boolean),
  providers: []
})(class GeospatialExplorerModule {}) || class GeospatialExplorerModule {};

// Export components individually for convenience
export { AngularMapComponent };
export { AngularGlobeComponent };

// Export types
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions
} from '../geospatial-core/types';

export type { DrawingData } from '../../utils/drawing-utils';
