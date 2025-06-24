
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
  // Angular not available - create stub module and components with proper structure
  NgModule = (config: any) => (target: any) => {
    target.ɵmod = {
      type: target,
      declarations: config.declarations || [],
      imports: config.imports || [],
      exports: config.exports || []
    };
    target.ɵinj = {
      factory: () => new target(),
      providers: config.providers || [],
      imports: config.imports || []
    };
    return target;
  };
  
  CommonModule = class {
    static ɵmod = { type: CommonModule };
    static ɵinj = { factory: () => new CommonModule() };
  };
  
  AngularMapComponent = class {
    static ɵcmp = {
      type: AngularMapComponent,
      selectors: [['geo-map']],
      standalone: true,
      inputs: {
        options: 'options',
        selectedLocation: 'selectedLocation',
        width: 'width',
        height: 'height',
        enableDrawing: 'enableDrawing'
      },
      outputs: {
        ready: 'ready',
        locationSelect: 'locationSelect',
        error: 'error',
        annotationsChange: 'annotationsChange',
        drawingCreated: 'drawingCreated',
        regionClick: 'regionClick'
      }
    };
    static ɵfac = () => new AngularMapComponent();
  };
  
  AngularGlobeComponent = class {
    static ɵcmp = {
      type: AngularGlobeComponent,
      selectors: [['geo-globe']],
      standalone: true,
      inputs: {
        options: 'options',
        selectedLocation: 'selectedLocation',
        width: 'width',
        height: 'height'
      },
      outputs: {
        ready: 'ready',
        flyComplete: 'flyComplete',
        error: 'error',
        locationSelect: 'locationSelect'
      }
    };
    static ɵfac = () => new AngularGlobeComponent();
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

// Simple DrawingData interface without dependencies
export interface DrawingData {
  id: string;
  type: string;
  data: any;
}
