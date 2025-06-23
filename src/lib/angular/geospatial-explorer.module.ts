
// Angular module - only available when Angular is installed
let NgModule: any, CommonModule: any;
let AngularMapComponent: any, AngularGlobeComponent: any;

// Conditional Angular imports with proper fallback types
let hasAngular = false;
try {
  const angularCore = require('@angular/core');
  const angularCommon = require('@angular/common');
  NgModule = angularCore.NgModule;
  CommonModule = angularCommon.CommonModule;
  hasAngular = true;
  
  // Import components only if Angular is available
  const mapComponent = require('./map.component');
  const globeComponent = require('./globe.component');
  AngularMapComponent = mapComponent.AngularMapComponent;
  AngularGlobeComponent = globeComponent.AngularGlobeComponent;
} catch (error) {
  // Angular not available - create stub module and components
  NgModule = () => (target: any) => target;
  CommonModule = class {};
  AngularMapComponent = class {
    static ɵcmp = {};
    static ɵfac = () => {};
  };
  AngularGlobeComponent = class {
    static ɵcmp = {};
    static ɵfac = () => {};
  };
}

@NgModule({
  declarations: hasAngular ? [
    AngularMapComponent,
    AngularGlobeComponent
  ] : [],
  imports: [
    CommonModule
  ],
  exports: hasAngular ? [
    AngularMapComponent,
    AngularGlobeComponent
  ] : [],
  providers: []
})
export class GeospatialExplorerModule {
  static forRoot() {
    return {
      ngModule: GeospatialExplorerModule,
      providers: []
    };
  }
}

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
