
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMapComponent } from './map.component';
import { AngularGlobeComponent } from './globe.component';

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
