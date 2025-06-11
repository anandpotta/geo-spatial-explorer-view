# GeoSpatial Explorer Library

A cross-platform geospatial library supporting React, React Native, and Angular applications with ABP Framework compatibility.

## Installation

```bash
npm install geospatial-explorer-lib
```

## Usage

### Angular (ABP Framework Compatible)

First, import the module in your Angular application:

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GeospatialModule } from 'geospatial-explorer-lib/angular';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    GeospatialModule // Add this
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Then use the components in your templates:

```html
<!-- app.component.html -->
<div class="container">
  <h2>Map Component</h2>
  <geo-map 
    [options]="mapOptions"
    [selectedLocation]="selectedLocation"
    (ready)="onMapReady()"
    (locationSelect)="onLocationSelect($event)">
  </geo-map>

  <h2>Globe Component</h2>
  <geo-globe 
    [options]="globeOptions"
    [selectedLocation]="selectedLocation"
    (ready)="onGlobeReady($event)"
    (locationSelect)="onLocationSelect($event)">
  </geo-globe>
</div>
```

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { GeoLocation, MapViewOptions, GlobeOptions } from 'geospatial-explorer-lib/angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  selectedLocation?: GeoLocation;
  
  mapOptions: Partial<MapViewOptions> = {
    initialZoom: 10
  };
  
  globeOptions: Partial<GlobeOptions> = {
    earthRadius: 5,
    enableAtmosphere: true
  };

  onMapReady() {
    console.log('Map is ready');
  }

  onGlobeReady(globe: any) {
    console.log('Globe is ready', globe);
  }

  onLocationSelect(location: GeoLocation) {
    console.log('Location selected:', location);
    this.selectedLocation = location;
  }
}
```

### React

```tsx
import { MapComponent, GlobeComponent } from 'geospatial-explorer-lib/react';

function App() {
  return (
    <div>
      <MapComponent
        options={{ initialZoom: 10 }}
        onLocationSelect={(location) => console.log('Selected:', location)}
      />
      <GlobeComponent
        options={{ earthRadius: 5 }}
        onReady={(api) => console.log('Globe ready')}
      />
    </div>
  );
}
```

### React Native

```tsx
import { MapComponent, GlobeComponent } from 'geospatial-explorer-lib/react-native';

function App() {
  return (
    <View style={{ flex: 1 }}>
      <MapComponent
        options={{ initialZoom: 10 }}
        onLocationSelect={(location) => console.log('Selected:', location)}
      />
    </View>
  );
}
```

## API Reference

### Core Types

- `GeoLocation`: Represents a geographic location with latitude/longitude
- `MapViewOptions`: Configuration options for map components
- `GlobeOptions`: Configuration options for globe components

### Angular Components

#### `<geo-map>`
**Inputs:**
- `options: Partial<MapViewOptions>` - Map configuration
- `selectedLocation?: GeoLocation` - Location to center on

**Outputs:**
- `(ready)` - Emitted when map is initialized
- `(locationSelect)` - Emitted when user selects a location
- `(error)` - Emitted when an error occurs

#### `<geo-globe>`
**Inputs:**
- `options: Partial<GlobeOptions>` - Globe configuration
- `selectedLocation?: GeoLocation` - Location to center on

**Outputs:**
- `(ready)` - Emitted when globe is initialized
- `(locationSelect)` - Emitted when user selects a location
- `(error)` - Emitted when an error occurs

### Utilities

- `calculateDistance(lat1, lng1, lat2, lng2)`: Calculate distance between two points
- `formatCoordinate(coord, type)`: Format coordinates for display
- `isWeb()`: Check if running in web environment
- `isReactNative()`: Check if running in React Native environment

## ABP Framework Integration

This library is fully compatible with ABP Framework applications. The Angular components follow ABP's module structure and can be easily integrated into your ABP Angular application.

### Installation in ABP Project

1. Install the package:
```bash
npm install geospatial-explorer-lib
```

2. Import in your feature module:
```typescript
import { GeospatialModule } from 'geospatial-explorer-lib/angular';

@NgModule({
  imports: [
    // ... other imports
    GeospatialModule
  ],
  // ...
})
export class YourFeatureModule { }
```

3. Use in your components as shown in the usage examples above.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT
