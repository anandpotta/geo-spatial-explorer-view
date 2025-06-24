
// Conditional Angular module that only works in Angular environments
let NgModule: any;
let CommonModule: any;

try {
  // Only import Angular modules if they're available
  const angularCore = require('@angular/core');
  const angularCommon = require('@angular/common');
  NgModule = angularCore.NgModule;
  CommonModule = angularCommon.CommonModule;
} catch (error) {
  // Create stub implementations for non-Angular environments
  NgModule = () => (target: any) => target;
  CommonModule = class StubCommonModule {};
}

let AngularMapComponent: any;
let AngularGlobeComponent: any;

try {
  AngularMapComponent = require('./map.component').AngularMapComponent;
  AngularGlobeComponent = require('./globe.component').AngularGlobeComponent;
} catch (error) {
  // Create stub components for non-Angular environments
  AngularMapComponent = class StubMapComponent {};
  AngularGlobeComponent = class StubGlobeComponent {};
}

@NgModule({
  imports: [
    CommonModule,
    AngularMapComponent,
    AngularGlobeComponent
  ],
  exports: [
    AngularMapComponent,
    AngularGlobeComponent
  ]
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

// Export types conditionally
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
