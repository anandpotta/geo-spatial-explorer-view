
// Example Angular module structure for geospatial explorer integration
// In a real Angular app, you would import from Angular packages

export interface DashboardModuleExample {
  declarations: string[];
  imports: string[];
  exports: string[];
}

// Example module configuration
export const dashboardModuleExample: DashboardModuleExample = {
  declarations: [
    'DashboardComponent'
  ],
  imports: [
    'CommonModule',
    'RouterModule.forChild([{ path: "", component: DashboardComponent }])',
    'GeospatialExplorerModule' // Your package module
  ],
  exports: [
    'DashboardComponent'
  ]
};

/*
In a real Angular application, this would look like:

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { GeospatialExplorerModule } from 'geospatial-explorer-lib/angular';

@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    GeospatialExplorerModule,
    RouterModule.forChild([
      { path: '', component: DashboardComponent }
    ])
  ],
  exports: [
    DashboardComponent
  ]
})
export class DashboardModule { }
*/
