# Angular Integration Guide

## Installation

```bash
npm install geospatial-explorer-lib
```

## Standalone Component Usage (Recommended)

Since the components are now standalone, you can import them directly:

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AngularMapComponent, 
  AngularGlobeComponent 
} from 'geospatial-explorer-lib/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AngularMapComponent, AngularGlobeComponent],
  template: `
    <div class="app-container">
      <h1>Geospatial Explorer</h1>
      
      <!-- Map Component -->
      <geo-map
        [options]="mapOptions"
        [selectedLocation]="selectedLocation"
        [width]="'100%'"
        [height]="'400px'"
        (ready)="onMapReady($event)"
        (locationSelect)="onLocationSelected($event)">
      </geo-map>
      
      <!-- Globe Component -->
      <geo-globe
        [options]="globeOptions"
        [selectedLocation]="selectedLocation"
        [width]="'100%'"
        [height]="'600px'"
        (ready)="onGlobeReady($event)"
        (locationSelect)="onLocationSelected($event)">
      </geo-globe>
    </div>
  `,
  styles: [`
    .app-container {
      padding: 20px;
    }
  `]
})
export class AppComponent {
  mapOptions = {
    initialZoom: 10,
    enableControls: true
  };
  
  globeOptions = {
    enableRotation: true,
    showAtmosphere: true
  };
  
  selectedLocation = {
    x: -122.4194,
    y: 37.7749,
    label: 'San Francisco'
  };
  
  onMapReady(mapInstance: any) {
    console.log('Map is ready:', mapInstance);
  }
  
  onGlobeReady(globeInstance: any) {
    console.log('Globe is ready:', globeInstance);
  }
  
  onLocationSelected(location: any) {
    console.log('Location selected:', location);
    this.selectedLocation = location;
  }
}
```

## Module-Based Usage (Legacy)

If you prefer using the module approach:

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GeospatialExplorerModule } from 'geospatial-explorer-lib/angular';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    GeospatialExplorerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Component Properties

### Map Component (`geo-map`)

**Inputs:**
- `options?: Partial<MapViewOptions>` - Map configuration options
- `selectedLocation?: GeoLocation | null` - Currently selected location
- `width?: string` - Map width (default: '100%')
- `height?: string` - Map height (default: '400px')
- `enableDrawing?: boolean` - Enable drawing tools (default: false)

**Outputs:**
- `ready: EventEmitter` - Fired when map is initialized
- `locationSelect: EventEmitter` - Fired when a location is selected
- `error: EventEmitter` - Fired when an error occurs
- `annotationsChange: EventEmitter` - Fired when annotations change
- `drawingCreated: EventEmitter` - Fired when a drawing is created
- `regionClick: EventEmitter` - Fired when a region is clicked

### Globe Component (`geo-globe`)

**Inputs:**
- `options?: Partial<GlobeOptions>` - Globe configuration options
- `selectedLocation?: GeoLocation | null` - Currently selected location
- `width?: string` - Globe width (default: '100%')
- `height?: string` - Globe height (default: '600px')

**Outputs:**
- `ready: EventEmitter` - Fired when globe is initialized
- `flyComplete: EventEmitter` - Fired when flight animation completes
- `error: EventEmitter` - Fired when an error occurs
- `locationSelect: EventEmitter` - Fired when a location is selected

## Types

```typescript
interface GeoLocation {
  x: number; // longitude
  y: number; // latitude
  label?: string;
}

interface MapViewOptions {
  initialZoom?: number;
  enableControls?: boolean;
  // ... other options
}

interface GlobeOptions {
  enableRotation?: boolean;
  showAtmosphere?: boolean;
  // ... other options
}
```

## Troubleshooting

### Components not recognized
- **Standalone components**: Import `AngularMapComponent` and `AngularGlobeComponent` directly
- **Module-based**: Use `GeospatialExplorerModule`

### Property binding errors
Make sure you're using the correct component selectors:
- `<geo-map>` for the map component
- `<geo-globe>` for the globe component

### Import errors
Use the correct import path: `geospatial-explorer-lib/angular`

## Breaking Changes in v0.2.2
- Components are now standalone by default
- Better TypeScript support
- Improved Angular compatibility

## Example Projects

Check the example implementations in the library documentation for complete working examples.
