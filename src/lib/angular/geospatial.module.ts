
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponentAngular } from './map.component';
import { GlobeComponentAngular } from './globe.component';

@NgModule({
  declarations: [
    MapComponentAngular,
    GlobeComponentAngular
  ],
  imports: [
    CommonModule
  ],
  exports: [
    MapComponentAngular,
    GlobeComponentAngular
  ]
})
export class GeospatialModule { }
