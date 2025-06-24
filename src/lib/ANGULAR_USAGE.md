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

## Troubleshooting Integration Issues

### 1. Build the npm package
After making changes, rebuild the package:
```bash
cd src/lib
npm run build
```

### 2. Republish (if needed)
If you're testing locally:
```bash
cd src/lib
npm version patch
npm publish
```

### 3. Update your Angular project
```bash
npm uninstall geospatial-explorer-lib
npm install geospatial-explorer-lib@latest
```

### 4. Clear Angular cache
```bash
ng cache clean
```

### 5. Verify imports
Make sure you're importing correctly:

**For standalone components:**
```typescript
import { AngularMapComponent, AngularGlobeComponent } from 'geospatial-explorer-lib/angular';
```

**For module approach:**
```typescript
import { GeospatialExplorerModule } from 'geospatial-explorer-lib/angular';
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
- `locationSelect: EventEmitter<GeoLocation>` - Fired when a location is selected
- `error: EventEmitter<Error>` - Fired when an error occurs
- `annotationsChange: EventEmitter<any[]>` - Fired when annotations change
- `drawingCreated: EventEmitter<any>` - Fired when a drawing is created
- `regionClick: EventEmitter<any>` - Fired when a region is clicked

### Globe Component (`geo-globe`)

**Inputs:**
- `options?: Partial<GlobeOptions>` - Globe configuration options
- `selectedLocation?: GeoLocation | null` - Currently selected location
- `width?: string` - Globe width (default: '100%')
- `height?: string` - Globe height (default: '600px')

**Outputs:**
- `ready: EventEmitter` - Fired when globe is initialized
- `flyComplete: EventEmitter` - Fired when flight animation completes
- `error: EventEmitter<Error>` - Fired when an error occurs
- `locationSelect: EventEmitter<GeoLocation>` - Fired when a location is selected

## Types

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
  // ... other options
}

interface GlobeOptions {
  enableRotation?: boolean;
  showAtmosphere?: boolean;
  // ... other options
}
```

## Common Integration Issues

### Components not recognized (NG8001)
- **Solution**: Import `AngularMapComponent` and `AngularGlobeComponent` in your component's `imports` array
- **Standalone components**: Add to `@Component.imports`
- **Module-based**: Add `GeospatialExplorerModule` to your module

### Property binding errors (NG8002)
- **Solution**: Ensure you're using the correct component selectors and the components are properly imported
- **Check**: Component selector should be `<geo-map>` and `<geo-globe>`
- **Verify**: Properties like `[options]` and `[selectedLocation]` are correctly bound

### Import path errors
- **Correct path**: `geospatial-explorer-lib/angular`
- **Not**: `geospatial-explorer-lib` or `geospatial-explorer-lib/lib/angular`

### Build issues after npm install
1. Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
2. Clear Angular cache: `ng cache clean`
3. Restart dev server: `ng serve`

## Example Integration Steps

1. **Install the package**:
   ```bash
   npm install geospatial-explorer-lib
   ```

2. **Import in your component**:
   ```typescript
   import { AngularMapComponent, AngularGlobeComponent } from 'geospatial-explorer-lib/angular';
   ```

3. **Add to component imports**:
   ```typescript
   @Component({
     // ...
     imports: [CommonModule, AngularMapComponent, AngularGlobeComponent],
     // ...
   })
   ```

4. **Use in template**:
   ```html
   <geo-map [selectedLocation]="location"></geo-map>
   <geo-globe [options]="globeOptions"></geo-globe>
   ```

If you continue to face issues, please check that:
- The npm package is properly built and published
- Your Angular project has the latest version installed
- The import paths are correct
- The components are added to the imports array

For debugging, you can also check if the components are properly exported by logging the import:
```typescript
import * as GeospatialComponents from 'geospatial-explorer-lib/angular';
console.log(GeospatialComponents);
```
