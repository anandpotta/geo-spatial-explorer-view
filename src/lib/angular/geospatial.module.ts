
// Angular module for geospatial explorer
export interface GeospatialModuleConfig {
  declarations: string[];
  imports: string[];
  exports: string[];
}

export const GeospatialModule: GeospatialModuleConfig = {
  declarations: ['GeoSpatialExplorerComponent'],
  imports: ['CommonModule'],
  exports: ['GeoSpatialExplorerComponent']
};

/*
In a real Angular environment, this would be:

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeoSpatialExplorerComponent } from './geo-spatial-explorer.component';

@NgModule({
  declarations: [GeoSpatialExplorerComponent],
  imports: [CommonModule],
  exports: [GeoSpatialExplorerComponent]
})
export class GeospatialModule { }
*/
