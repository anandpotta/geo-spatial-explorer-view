
# Angular Integration Guide for Geospatial Explorer Library

## Prerequisites

- Angular 12+ (Recommended: Angular 17+)
- Node.js 18+
- npm or yarn

## Step-by-Step Integration

### 1. Build the Library Package

```bash
# Navigate to the library directory
cd src/lib

# Install dependencies (if not already installed)
npm install

# Build the package
npm run build

# Create a local package for testing
cd dist
npm pack

# This creates geospatial-explorer-lib-0.1.10.tgz
```

### 2. Create Angular Project (if needed)

```bash
# Create new Angular project
ng new my-geo-app --standalone
cd my-geo-app

# Or use existing Angular project
cd your-existing-angular-project
```

### 3. Install the Library

```bash
# Install the local package
npm install /path/to/geospatial-explorer-lib-0.1.10.tgz

# Install required peer dependencies
npm install @angular/core @angular/common

# Or if published to npm registry
# npm install geospatial-explorer-lib
```

### 4. Angular Integration

#### Method 1: Standalone Components (Recommended for Angular 17+)

```typescript
// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AngularMapComponent, 
  AngularGlobeComponent,
  type GeoLocation,
  type MapViewOptions,
  type GlobeOptions
} from 'geospatial-explorer-lib/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    AngularMapComponent, 
    AngularGlobeComponent
  ],
  template: `
    <div class="container">
      <h1>Geospatial Explorer Demo</h1>
      
      <div class="controls">
        <button 
          (click)="setLocation('nyc')"
          class="btn">
          New York
        </button>
        <button 
          (click)="setLocation('london')"
          class="btn">
          London
        </button>
        <button 
          (click)="setLocation('tokyo')"
          class="btn">
          Tokyo
        </button>
      </div>
      
      <!-- Map Component -->
      <div class="component-section">
        <h2>Map View</h2>
        <geo-map
          [options]="mapOptions"
          [selectedLocation]="selectedLocation"
          [enableDrawing]="true"
          (ready)="onMapReady($event)"
          (locationSelect)="onLocationSelected($event)"
          (annotationsChange)="onAnnotationsChange($event)">
        </geo-map>
      </div>
      
      <!-- Globe Component -->
      <div class="component-section">
        <h2>Globe View</h2>
        <geo-globe
          [options]="globeOptions"
          [selectedLocation]="selectedLocation"
          (ready)="onGlobeReady($event)"
          (flyComplete)="onFlyComplete()"
          (locationSelect)="onLocationSelected($event)">
        </geo-globe>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      font-family: Arial, sans-serif;
    }
    
    h1 {
      margin-bottom: 20px;
      color: #333;
      text-align: center;
    }
    
    .controls {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-bottom: 30px;
    }
    
    .btn {
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn:hover {
      background: #0056b3;
    }
    
    .component-section {
      margin-bottom: 30px;
    }
    
    .component-section h2 {
      margin-bottom: 15px;
      color: #555;
    }
    
    geo-map, geo-globe {
      display: block;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }
  `]
})
export class AppComponent {
  selectedLocation: GeoLocation | null = null;
  
  private locations = {
    nyc: { id: 'nyc', x: -74.0060, y: 40.7128, label: 'New York City' },
    london: { id: 'london', x: -0.1278, y: 51.5074, label: 'London' },
    tokyo: { id: 'tokyo', x: 139.6917, y: 35.6895, label: 'Tokyo' }
  };
  
  mapOptions: Partial<MapViewOptions> = {
    initialZoom: 10,
    enableControls: true
  };
  
  globeOptions: Partial<GlobeOptions> = {
    enableRotation: true,
    showAtmosphere: true
  };
  
  setLocation(key: string) {
    this.selectedLocation = this.locations[key as keyof typeof this.locations];
    console.log('Location set to:', this.selectedLocation?.label);
  }
  
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
  
  onAnnotationsChange(annotations: any[]) {
    console.log('Annotations changed:', annotations);
  }
  
  onFlyComplete() {
    console.log('Globe fly animation completed');
  }
}
```

#### Method 2: Module-Based (Legacy Angular)

```typescript
// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GeospatialExplorerModule } from 'geospatial-explorer-lib/angular';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    GeospatialExplorerModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### 5. Bootstrap Your Application

```typescript
// src/main.ts (for standalone components)
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent)
  .catch((err) => console.error(err));
```

### 6. Run Your Application

```bash
ng serve
```

## Component API Reference

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
- `drawingCreated: EventEmitter<any>` - Fired when a drawing is created
- `regionClick: EventEmitter<any>` - Fired when a region is clicked

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

## TypeScript Interfaces

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

### Common Build Issues

1. **Module Resolution Errors**
   ```bash
   # Clear Angular cache
   ng cache clean
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   
   # Rebuild the library
   cd src/lib && npm run build
   ```

2. **TypeScript Compilation Errors**
   - Ensure Angular version compatibility (12+)
   - Check that peer dependencies are installed
   - Verify TypeScript version compatibility

3. **Component Recognition Issues**
   - For standalone components: Add to `imports` array
   - For modules: Import `GeospatialExplorerModule`
   - Check correct import path: `'geospatial-explorer-lib/angular'`

### Development Workflow

1. **Make changes to library:**
   ```bash
   cd src/lib
   npm run build
   cd dist && npm pack
   ```

2. **Update in Angular project:**
   ```bash
   npm uninstall geospatial-explorer-lib
   npm install /path/to/geospatial-explorer-lib-x.x.x.tgz
   ```

3. **Test changes:**
   ```bash
   ng serve
   ```

## Complete Package.json Example

```json
{
  "name": "my-geo-app",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build"
  },
  "dependencies": {
    "@angular/animations": "^17.0.0",
    "@angular/common": "^17.0.0",
    "@angular/compiler": "^17.0.0",
    "@angular/core": "^17.0.0",
    "@angular/platform-browser": "^17.0.0",
    "@angular/platform-browser-dynamic": "^17.0.0",
    "geospatial-explorer-lib": "file:../path/to/geospatial-explorer-lib-0.1.10.tgz"
  },
  "devDependencies": {
    "@angular/cli": "^17.0.0",
    "@angular/compiler-cli": "^17.0.0",
    "typescript": "~5.2.0"
  }
}
```

This comprehensive guide should resolve the module resolution and component recognition issues you were experiencing. The key changes include proper peer dependency handling, corrected TypeScript configuration, and enhanced build process.
