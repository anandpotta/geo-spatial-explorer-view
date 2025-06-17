
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

The React components provide full 3D globe visualization and 2D mapping capabilities with advanced drawing tools.

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

#### Standalone Map with Advanced Drawing

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

  const handleRegionClick = (drawing) => {
    console.log('Drawing region clicked:', drawing);
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
      onRegionClick={handleRegionClick}
      onGeoJSONGenerated={(geojson) => {
        console.log('GeoJSON generated:', geojson);
      }}
    />
  );
}

export default MapApp;
```

#### Drawing Tools and File Upload

```tsx
import React from 'react';
import { StandaloneMapComponent } from 'geospatial-explorer-lib/react';
import { useDrawingFileUpload } from 'geospatial-explorer-lib/react';

function DrawingApp() {
  const { handleUploadToDrawing } = useDrawingFileUpload();

  const handleDrawingUpload = (drawingId, file) => {
    // Upload floor plans or images to specific drawings
    handleUploadToDrawing(drawingId, file);
  };

  return (
    <StandaloneMapComponent
      showInternalSearch={true}
      showDownloadButton={true}
      enableDrawingTools={true}
      onDrawingCreated={(drawing) => {
        console.log('New drawing created:', drawing);
      }}
      onDrawingUpload={handleDrawingUpload}
      onRegionClick={(drawing) => {
        console.log('Drawing clicked:', drawing);
      }}
    />
  );
}

export default DrawingApp;
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

React Native components are optimized for mobile devices with touch-friendly drawing tools.

#### Basic Setup

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapComponent } from 'geospatial-explorer-lib/react-native';

const App = () => {
  const handleMapReady = () => {
    console.log('Mobile map is ready!');
  };

  const handleDrawingInteraction = (drawing) => {
    console.log('Drawing interaction on mobile:', drawing);
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
        onRegionClick={handleDrawingInteraction}
        options={{
          initialZoom: 12,
          maxZoom: 18,
          enableTouchDrawing: true
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

#### Mobile Drawing Features

```tsx
import React from 'react';
import { View } from 'react-native';
import { MapComponent, useDrawingFileUpload } from 'geospatial-explorer-lib/react-native';

const DrawingScreen = () => {
  const { handleUploadToDrawing } = useDrawingFileUpload();

  return (
    <View style={{ flex: 1 }}>
      <MapComponent
        selectedLocation={{
          id: 'london',
          label: 'London',
          x: -0.1276,  // longitude
          y: 51.5074   // latitude
        }}
        onReady={(api) => {
          console.log('Mobile map ready:', api);
        }}
        onDrawingCreated={(drawing) => {
          console.log('Mobile drawing created:', drawing);
        }}
        onRegionClick={(drawing) => {
          console.log('Mobile drawing clicked:', drawing);
        }}
        options={{
          enableTouchDrawing: true,
          supportFileUpload: true
        }}
      />
    </View>
  );
};

export default DrawingScreen;
```

### Angular

Angular components integrate seamlessly with Angular applications and provide robust drawing capabilities.

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

  onRegionClick(drawing: any) {
    console.log('Drawing clicked in Angular:', drawing);
    // Handle drawing interactions
  }

  onDrawingCreated(drawing: any) {
    console.log('Drawing created in Angular:', drawing);
    // Handle new drawing creation
  }
}
```

#### Advanced Drawing Integration

```typescript
// drawing.component.ts
import { Component, OnInit } from '@angular/core';
import { GlobeComponent } from 'geospatial-explorer-lib/angular';
import type { GeoLocation, GlobeOptions } from 'geospatial-explorer-lib/angular';

@Component({
  selector: 'app-drawing-map',
  template: `
    <div class="drawing-container" style="width: 100%; height: 600px;">
      <div *ngIf="!isMapReady" class="map-loading">
        <div class="spinner"></div>
        <h3>Loading Drawing Tools...</h3>
      </div>
      <div class="drawing-controls" *ngIf="isMapReady">
        <button (click)="enableDrawing()" class="draw-btn">Enable Drawing</button>
        <input type="file" (change)="onFileUpload($event)" accept="image/*,.pdf" />
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
    .drawing-controls {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
    }
  `]
})
export class DrawingMapComponent implements OnInit {
  isMapReady = false;
  
  selectedLocation: GeoLocation = {
    id: 'tokyo',
    label: 'Tokyo',
    x: 139.6917, // longitude
    y: 35.6895   // latitude
  };

  ngOnInit() {
    console.log('Drawing map component initialized');
  }

  onMapReady(api: any) {
    this.isMapReady = true;
    console.log('Angular drawing map ready:', api);
  }

  onRegionClick(drawing: any) {
    console.log('Drawing region clicked:', drawing);
    // Handle drawing clicks with improved event handling
  }

  onDrawingCreated(drawing: any) {
    console.log('New drawing created:', drawing);
    // Handle newly created drawings
  }

  enableDrawing() {
    // Enable drawing tools
    console.log('Drawing tools enabled');
  }

  onFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('File selected for upload:', file.name);
      // Handle file upload to drawings
    }
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
  enableTouchDrawing?: boolean; // For mobile
  supportFileUpload?: boolean;
}

interface GlobeOptions {
  enableControls?: boolean;
  showAtmosphere?: boolean;
  enableAutoRotate?: boolean;
  rotationSpeed?: number;
}

interface DrawingData {
  id: string;
  type: 'polygon' | 'marker' | 'polyline';
  coordinates: number[][];
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: string;
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
  enableDrawingTools?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  onLocationChange?: (location: any) => void;
  onAnnotationsChange?: (annotations: any[]) => void;
  onGeoJSONGenerated?: (geojson: any) => void;
  onDrawingCreated?: (drawing: DrawingData) => void;
  onRegionClick?: (drawing: DrawingData) => void;
  onDrawingUpload?: (drawingId: string, file: File) => void;
  theme?: 'light' | 'dark';
  initialZoom?: number;
  defaultLocation?: {
    latitude: number;
    longitude: number;
  };
}
```

## Advanced Features

### Drawing and Annotation Tools
- Polygon drawing with click handlers
- File upload to drawings (images, PDFs)
- SVG path manipulation and clipping
- Interactive drawing controls
- Floor plan overlay support

### Event Handling
- Robust click detection on drawings
- Layer-based event management
- Global path click handlers
- Touch-optimized mobile interactions

### Data Management
- Local storage integration
- User-based data isolation
- Drawing persistence
- GeoJSON export functionality

## Platform-Specific Features

### React Features
- Full 3D globe with Three.js
- 2D mapping with Leaflet
- Advanced drawing tools and annotations
- File upload and floor plan integration
- GeoJSON export functionality
- Location search integration
- Responsive design
- Robust click event handling

### React Native Features
- Native mobile map components
- Touch-optimized drawing controls
- Offline capability
- GPS integration support
- Performance optimized for mobile
- File upload support
- Gesture-based interactions

### Angular Features
- Angular service integration
- Component lifecycle management
- RxJS observable support
- Angular forms integration
- Dependency injection ready
- TypeScript-first development
- Event binding integration

## Installation Examples

### React Project
```bash
npm install geospatial-explorer-lib
# Peer dependencies for React
npm install react react-dom three leaflet leaflet-draw
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

### Custom Drawing Event Handling
```typescript
// React implementation
const handleDrawingInteraction = (drawing: DrawingData) => {
  console.log('Drawing clicked:', drawing);
  // Custom logic for drawing interactions
};

// Angular implementation
onDrawingClick(drawing: DrawingData) {
  console.log('Angular drawing click:', drawing);
  // Handle drawing clicks in Angular
}
```

### File Upload Integration
```typescript
// React hook usage
import { useDrawingFileUpload } from 'geospatial-explorer-lib/react';

const { handleUploadToDrawing } = useDrawingFileUpload();

const uploadFile = (drawingId: string, file: File) => {
  handleUploadToDrawing(drawingId, file);
};
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

## Recent Updates

### v0.1.3
- Enhanced drawing click detection and event handling
- Improved layer management for better performance
- Added robust SVG path manipulation
- Better file upload integration
- Enhanced mobile touch interactions
- Improved TypeScript definitions

### v0.1.2
- Initial cross-platform release
- React and Angular support
- Core mapping functionality

## Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for more details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- [GitHub Issues](https://github.com/your-org/geospatial-explorer-lib/issues)
- [Documentation](https://docs.geospatial-explorer-lib.com)
- [Discord Community](https://discord.gg/geospatial-explorer)
