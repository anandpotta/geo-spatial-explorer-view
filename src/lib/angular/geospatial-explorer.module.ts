
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
