
# Geospatial Explorer Library

A cross-platform geospatial mapping library that works with React, React Native, and Angular applications.

## Installation

```bash
npm install geospatial-explorer-lib
```

## Platform Support

- **React**: Web applications with full 3D globe and 2D mapping
- **React Native**: Mobile applications with map components
- **Angular**: Angular applications with geospatial components

## Quick Start

### React

The React components provide full 3D globe visualization and 2D mapping capabilities.

#### Basic Map Component

```tsx
import React from 'react';
import { MapComponent } from 'geospatial-explorer-lib/react';

function App() {
  return (
    <MapComponent
      selectedLocation={{
        id: '1',
        label: 'New York City',
        x: -74.0060, // longitude
        y: 40.7128   // latitude
      }}
      onReady={(mapApi) => {
        console.log('Map is ready!', mapApi);
      }}
      onLocationSelect={(location) => {
        console.log('Location selected:', location);
      }}
    />
  );
}

export default App;
```

#### Standalone Map with Search

```tsx
import React from 'react';
import { StandaloneMapComponent } from 'geospatial-explorer-lib/react';

function MapApp() {
  const handleLocationChange = (location) => {
    console.log('Location changed:', location);
  };

  const handleAnnotationsChange = (annotations) => {
    console.log('Annotations updated:', annotations);
  };

  return (
    <StandaloneMapComponent
      externalLocation={{
        latitude: 40.7128,
        longitude: -74.0060,
        label: "New York City",
        searchString: "NYC"
      }}
      showInternalSearch={true}
      showDownloadButton={true}
      showSavedLocationsDropdown={true}
      width="100%"
      height="600px"
      theme="light"
      initialZoom={10}
      onLocationChange={handleLocationChange}
      onAnnotationsChange={handleAnnotationsChange}
      onGeoJSONGenerated={(geojson) => {
        console.log('GeoJSON generated:', geojson);
      }}
    />
  );
}

export default MapApp;
```

#### 3D Globe Component

```tsx
import React from 'react';
import { GlobeComponent } from 'geospatial-explorer-lib/react';

function GlobeApp() {
  return (
    <GlobeComponent
      selectedLocation={{
        id: 'nyc',
        label: 'New York',
        x: -74.0060,
        y: 40.7128
      }}
      options={{
        enableControls: true,
        showAtmosphere: true,
        enableAutoRotate: false
      }}
      onReady={(globeApi) => {
        console.log('Globe ready!', globeApi);
      }}
      onFlyComplete={() => {
        console.log('Fly animation completed');
      }}
    />
  );
}

export default GlobeApp;
```

### React Native

React Native components are optimized for mobile devices.

#### Basic Setup

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapComponent } from 'geospatial-explorer-lib/react-native';

const App = () => {
  const handleMapReady = () => {
    console.log('Mobile map is ready!');
  };

  return (
    <View style={styles.container}>
      <MapComponent
        selectedLocation={{
          id: '1',
          label: 'San Francisco',
          x: -122.4194, // longitude
          y: 37.7749    // latitude
        }}
        onReady={handleMapReady}
        options={{
          initialZoom: 12,
          maxZoom: 18
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
```

#### Globe in React Native

```tsx
import React from 'react';
import { View } from 'react-native';
import { GlobeComponent } from 'geospatial-explorer-lib/react-native';

const GlobeScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <GlobeComponent
        selectedLocation={{
          id: 'london',
          label: 'London',
          x: -0.1276,  // longitude
          y: 51.5074   // latitude
        }}
        onReady={(api) => {
          console.log('Mobile globe ready:', api);
        }}
      />
    </View>
  );
};

export default GlobeScreen;
```

### Angular

Angular components integrate seamlessly with Angular applications.

#### Module Setup

First, import the library types in your Angular module:

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { MapComponent } from './map.component'; // Your custom component

@NgModule({
  declarations: [
    AppComponent,
    MapComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

#### Map Component Implementation

```typescript
// map.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapComponentAngular } from 'geospatial-explorer-lib/angular';
import type { GeoLocation } from 'geospatial-explorer-lib/angular';

@Component({
  selector: 'app-map',
  template: `
    <div class="map-container" style="width: 100%; height: 400px;">
      <div *ngIf="!isMapReady" class="loading">Loading map...</div>
      <div #mapContainer class="map-canvas"></div>
    </div>
  `,
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {
  isMapReady = false;
  selectedLocation: GeoLocation = {
    id: 'berlin',
    label: 'Berlin',
    x: 13.4050, // longitude
    y: 52.5200  // latitude
  };

  ngOnInit() {
    this.initializeMap();
  }

  ngOnDestroy() {
    // Cleanup map resources
  }

  private initializeMap() {
    // Use MapComponentAngular configuration
    console.log('Initializing map with:', MapComponentAngular);
    // Implementation details would go here
    setTimeout(() => {
      this.isMapReady = true;
    }, 1000);
  }

  onLocationSelect(location: GeoLocation) {
    console.log('Location selected in Angular:', location);
    this.selectedLocation = location;
  }
}
```

#### Globe Component in Angular

```typescript
// globe.component.ts
import { Component, OnInit } from '@angular/core';
import { GlobeComponent } from 'geospatial-explorer-lib/angular';
import type { GeoLocation, GlobeOptions } from 'geospatial-explorer-lib/angular';

@Component({
  selector: 'app-globe',
  template: `
    <div class="globe-container" style="width: 100%; height: 500px;">
      <div *ngIf="!isGlobeReady" class="globe-loading">
        <div class="spinner"></div>
        <h3>Loading 3D Globe...</h3>
      </div>
    </div>
  `,
  styles: [`
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 2s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class AppGlobeComponent implements OnInit {
  isGlobeReady = false;
  
  globeOptions: Partial<GlobeOptions> = {
    enableControls: true,
    showAtmosphere: true,
    enableAutoRotate: false
  };

  selectedLocation: GeoLocation = {
    id: 'tokyo',
    label: 'Tokyo',
    x: 139.6917, // longitude
    y: 35.6895   // latitude
  };

  ngOnInit() {
    console.log('Globe component initialized');
    // Initialize globe with GlobeComponent configuration
  }

  onGlobeReady(api: any) {
    this.isGlobeReady = true;
    console.log('Angular globe ready:', api);
  }
}
```

## Core Types

```typescript
// Common types used across all platforms
interface GeoLocation {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
}

interface MapViewOptions {
  initialCenter?: [number, number];
  initialZoom?: number;
  maxZoom?: number;
}

interface GlobeOptions {
  enableControls?: boolean;
  showAtmosphere?: boolean;
  enableAutoRotate?: boolean;
  rotationSpeed?: number;
}

// React-specific types
interface StandaloneMapProps {
  externalLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
    label?: string;
  };
  showInternalSearch?: boolean;
  showDownloadButton?: boolean;
  showSavedLocationsDropdown?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  onLocationChange?: (location: any) => void;
  onAnnotationsChange?: (annotations: any[]) => void;
  onGeoJSONGenerated?: (geojson: any) => void;
  theme?: 'light' | 'dark';
  initialZoom?: number;
  defaultLocation?: {
    latitude: number;
    longitude: number;
  };
}
```

## Platform-Specific Features

### React Features
- Full 3D globe with Three.js
- 2D mapping with Leaflet
- Drawing tools and annotations
- GeoJSON export functionality
- Location search integration
- Responsive design

### React Native Features
- Native mobile map components
- Touch-optimized controls
- Offline capability
- GPS integration support
- Performance optimized for mobile

### Angular Features
- Angular service integration
- Component lifecycle management
- RxJS observable support
- Angular forms integration
- Dependency injection ready

## Installation Examples

### React Project
```bash
npm install geospatial-explorer-lib
# Peer dependencies for React
npm install react react-dom three leaflet
```

### React Native Project
```bash
npm install geospatial-explorer-lib
# React Native specific dependencies
npm install react-native react-native-webview
```

### Angular Project
```bash
npm install geospatial-explorer-lib
# Angular peer dependencies
npm install @angular/core @angular/common
```

## Advanced Usage

### Custom Styling
```css
/* Custom CSS for map components */
.geo-map-container {
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.geo-globe-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Error Handling
```typescript
// React error handling
const handleMapError = (error: Error) => {
  console.error('Map initialization failed:', error);
  // Handle error appropriately
};

// Angular error handling
onMapError(error: Error) {
  console.error('Angular map error:', error);
  // Implement error recovery
}
```

## Browser Support

- **React**: Modern browsers (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- **React Native**: iOS 10+, Android 6.0+ (API level 23+)
- **Angular**: Angular 13+ with modern browser support

## Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for more details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- [GitHub Issues](https://github.com/your-org/geospatial-explorer-lib/issues)
- [Documentation](https://docs.geospatial-explorer-lib.com)
- [Discord Community](https://discord.gg/geospatial-explorer)

## Changelog

### v0.1.3
- Added React Native support
- Enhanced Angular integration
- Improved TypeScript definitions
- Better error handling

### v0.1.2
- Initial cross-platform release
- React and Angular support
- Core mapping functionality
