
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMapComponent } from './map.component';
import { AngularGlobeComponent } from './globe.component';

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
export class GeospatialExplorerModule { }

// Export components individually for convenience
export { AngularMapComponent } from './map.component';
export { AngularGlobeComponent } from './globe.component';

// Export types
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions
} from '../geospatial-core/types';

export type { DrawingData } from '../../utils/drawing-utils';
