
// Angular module - only available when Angular is installed
let NgModule: any, CommonModule: any;
let AngularMapComponent: any, AngularGlobeComponent: any;

try {
  const angularCore = require('@angular/core');
  const angularCommon = require('@angular/common');
  NgModule = angularCore.NgModule;
  CommonModule = angularCommon.CommonModule;
  
  // Import components only if Angular is available
  const mapComponent = require('./map.component');
  const globeComponent = require('./globe.component');
  AngularMapComponent = mapComponent.AngularMapComponent;
  AngularGlobeComponent = globeComponent.AngularGlobeComponent;
} catch (error) {
  // Angular not available - create stub module
  NgModule = () => (target: any) => target;
  CommonModule = class {};
  AngularMapComponent = class {};
  AngularGlobeComponent = class {};
}

@NgModule({
  declarations: [
    AngularMapComponent,
    AngularGlobeComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    AngularMapComponent,
    AngularGlobeComponent
  ],
  providers: []
})
export class GeospatialExplorerModule {}

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
