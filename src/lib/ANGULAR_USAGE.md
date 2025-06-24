
# Angular Integration Guide

## Installation

```bash
npm install geospatial-explorer-lib
```

## Quick Setup

### 1. Standalone Component Usage (Recommended)

Since the components are standalone, you can import them directly without a module:

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AngularMapComponent, 
  AngularGlobeComponent,
  type GeoLocation 
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
        [selectedLocation]="selectedLocation"
        [enableDrawing]="true"
        (ready)="onMapReady($event)"
        (locationSelect)="onLocationSelected($event)">
      </geo-map>
      
      <!-- Globe Component -->
      <geo-globe
        [selectedLocation]="selectedLocation"
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
  selectedLocation: GeoLocation | null = {
    id: 'sf',
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
  
  onLocationSelected(location: GeoLocation) {
    console.log('Location selected:', location);
    this.selectedLocation = location;
  }
}
```

### 2. Module-Based Usage (Legacy)

For older Angular applications:

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GeospatialExplorerModule } from 'geospatial-explorer-lib/angular';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
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

### Map Component (`<geo-map>`)

**Inputs:**
- `selectedLocation?: GeoLocation | null` - Currently selected location
- `options?: Partial<MapViewOptions>` - Map configuration options
- `width?: string` - Map width (default: '100%')
- `height?: string` - Map height (default: '400px')
- `enableDrawing?: boolean` - Enable drawing tools (default: false)

**Outputs:**
- `ready: EventEmitter<any>` - Fired when map is initialized
- `locationSelect: EventEmitter<GeoLocation>` - Fired when a location is selected
- `error: EventEmitter<Error>` - Fired when an error occurs
- `annotationsChange: EventEmitter<any[]>` - Fired when annotations change

### Globe Component (`<geo-globe>`)

**Inputs:**
- `selectedLocation?: GeoLocation | null` - Currently selected location
- `options?: Partial<GlobeOptions>` - Globe configuration options
- `width?: string` - Globe width (default: '100%')
- `height?: string` - Globe height (default: '600px')

**Outputs:**
- `ready: EventEmitter<any>` - Fired when globe is initialized
- `flyComplete: EventEmitter<void>` - Fired when flight animation completes
- `error: EventEmitter<Error>` - Fired when an error occurs
- `locationSelect: EventEmitter<GeoLocation>` - Fired when a location is selected

## TypeScript Types

```typescript
interface GeoLocation {
  id: string;
  x: number; // longitude
  y: number; // latitude
  label?: string;
}

interface MapViewOptions {
  initialZoom?: number;
  enableControls?: boolean;
}

interface GlobeOptions {
  enableRotation?: boolean;
  showAtmosphere?: boolean;
}
```

## Troubleshooting

### Build Errors
1. Clear Angular cache: `ng cache clean`
2. Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`
3. Restart dev server: `ng serve`

### Import Issues
- Use correct import path: `geospatial-explorer-lib/angular`
- Ensure components are in the `imports` array for standalone components
- For modules, import `GeospatialExplorerModule`

### Template Errors
- Use correct selectors: `<geo-map>` and `<geo-globe>`
- Check property bindings: `[selectedLocation]="location"`
- Verify event handlers: `(ready)="onMapReady($event)"`

## Example Project Structure

```
src/
├── app/
│   ├── app.component.ts       # Main component with maps
│   ├── app.component.html     # Template (if using separate files)
│   └── main.ts               # Bootstrap file
└── ...
```

## Complete Working Example

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent);
```

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AngularMapComponent, 
  AngularGlobeComponent,
  type GeoLocation 
} from 'geospatial-explorer-lib/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AngularMapComponent, AngularGlobeComponent],
  template: `
    <div style="padding: 20px;">
      <h1>My Geospatial App</h1>
      <geo-map [selectedLocation]="location" (locationSelect)="location = $event"></geo-map>
      <geo-globe [selectedLocation]="location" (locationSelect)="location = $event"></geo-globe>
    </div>
  `
})
export class AppComponent {
  location: GeoLocation | null = null;
}
```

This setup should work immediately after installing the package. The components are fully self-contained and don't require additional dependencies beyond Angular itself.
