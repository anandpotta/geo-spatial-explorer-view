
# Angular Integration Guide for Geospatial Explorer Library

## Quick Setup Steps

### 1. Build and Install the Package

```bash
# Navigate to the library directory
cd src/lib

# Build the package
npm run build

# Create a local package for testing
cd dist
npm pack

# This creates geospatial-explorer-lib-0.1.9.tgz
```

### 2. Install in Your Angular Project

```bash
# In your Angular project directory
npm install /path/to/geospatial-explorer-lib-0.1.9.tgz

# Or if published to npm
npm install geospatial-explorer-lib
```

### 3. Angular Project Setup

#### For Standalone Components (Recommended)

```typescript
// app.component.ts
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
      
      <!-- Map Component -->
      <geo-map
        [options]="mapOptions"
        [selectedLocation]="selectedLocation"
        [enableDrawing]="true"
        (ready)="onMapReady($event)"
        (locationSelect)="onLocationSelected($event)"
        (annotationsChange)="onAnnotationsChange($event)">
      </geo-map>
      
      <!-- Globe Component -->
      <geo-globe
        [options]="globeOptions"
        [selectedLocation]="selectedLocation"
        (ready)="onGlobeReady($event)"
        (flyComplete)="onFlyComplete()"
        (locationSelect)="onLocationSelected($event)">
      </geo-globe>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      margin-bottom: 20px;
      color: #333;
    }
    
    geo-map, geo-globe {
      display: block;
      margin-bottom: 20px;
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
  
  mapOptions: Partial<MapViewOptions> = {
    initialZoom: 10,
    enableControls: true
  };
  
  globeOptions: Partial<GlobeOptions> = {
    enableRotation: true,
    showAtmosphere: true
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
  
  onAnnotationsChange(annotations: any[]) {
    console.log('Annotations changed:', annotations);
  }
  
  onFlyComplete() {
    console.log('Globe fly animation completed');
  }
}
```

#### For Module-Based Setup (Legacy)

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
    GeospatialExplorerModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### 4. Bootstrap Your Application

```typescript
// main.ts (for standalone components)
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent)
  .catch((err) => console.error(err));
```

## Complete Working Example

Here's a minimal working Angular application:

### Project Structure
```
my-angular-app/
├── src/
│   ├── app/
│   │   └── app.component.ts
│   └── main.ts
├── angular.json
├── package.json
└── tsconfig.json
```

### package.json
```json
{
  "name": "my-angular-app",
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
    "geospatial-explorer-lib": "file:../path/to/geospatial-explorer-lib-0.1.9.tgz"
  }
}
```

### Complete app.component.ts
```typescript
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
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Geospatial Explorer Test</h1>
      
      <div style="margin-bottom: 20px;">
        <button 
          (click)="setLocation('nyc')"
          style="margin-right: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          New York
        </button>
        <button 
          (click)="setLocation('london')"
          style="margin-right: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          London
        </button>
        <button 
          (click)="setLocation('tokyo')"
          style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Tokyo
        </button>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2>Map Component</h2>
        <geo-map
          [selectedLocation]="currentLocation"
          [enableDrawing]="true"
          (locationSelect)="onLocationSelect($event)"
          (ready)="onMapReady($event)">
        </geo-map>
      </div>
      
      <div>
        <h2>Globe Component</h2>
        <geo-globe
          [selectedLocation]="currentLocation"
          (locationSelect)="onLocationSelect($event)"
          (ready)="onGlobeReady($event)">
        </geo-globe>
      </div>
    </div>
  `
})
export class AppComponent {
  currentLocation: GeoLocation | null = null;
  
  locations = {
    nyc: { id: 'nyc', x: -74.0060, y: 40.7128, label: 'New York City' },
    london: { id: 'london', x: -0.1278, y: 51.5074, label: 'London' },
    tokyo: { id: 'tokyo', x: 139.6917, y: 35.6895, label: 'Tokyo' }
  };
  
  setLocation(key: string) {
    this.currentLocation = this.locations[key as keyof typeof this.locations];
  }
  
  onLocationSelect(location: GeoLocation) {
    console.log('Location selected:', location);
    this.currentLocation = location;
  }
  
  onMapReady(instance: any) {
    console.log('Map ready:', instance);
  }
  
  onGlobeReady(instance: any) {
    console.log('Globe ready:', instance);
  }
}
```

## Troubleshooting

### Common Issues and Solutions

1. **Module Resolution Errors**
   ```bash
   # Clear Angular cache
   ng cache clean
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript Errors**
   - Ensure you're importing from `'geospatial-explorer-lib/angular'`
   - Check that components are in the `imports` array

3. **Build Errors**
   - Verify Angular version compatibility (v12+)
   - Check peer dependencies are installed

### Development Workflow

1. **Build the library:**
   ```bash
   cd src/lib
   npm run build
   ```

2. **Test locally:**
   ```bash
   cd dist
   npm pack
   # Install the .tgz file in your test project
   ```

3. **Publish (when ready):**
   ```bash
   cd dist
   npm publish
   ```

This setup provides a complete, working integration of the Geospatial Explorer library in Angular applications with proper component recognition and TypeScript support.
