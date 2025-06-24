
# Geospatial Explorer Library

A comprehensive cross-platform geospatial library that provides map and globe components for React, Angular, and React Native applications.

## Features

- 🗺️ Interactive map components with drawing capabilities
- 🌍 3D globe visualization with Three.js
- 📱 Cross-platform support (React, Angular, React Native)
- 🎨 Customizable themes and styling
- 📍 Location search and geocoding
- ✏️ Drawing tools and annotations
- 📊 GeoJSON import/export functionality
- 🔄 Real-time data synchronization

## Installation

```bash
npm install geospatial-explorer-lib
```

## Usage

### React

#### Basic Map Component

```tsx
import React from 'react';
import { StandaloneMapComponent } from 'geospatial-explorer-lib';

const MyMapApp = () => {
  const handleLocationChange = (location) => {
    console.log('New location:', location);
  };

  return (
    <StandaloneMapComponent
      width="100%"
      height="400px"
      showInternalSearch={true}
      enableDrawing={true}
      theme="light"
      onLocationChange={handleLocationChange}
      onAnnotationsChange={(annotations) => {
        console.log('Annotations updated:', annotations);
      }}
    />
  );
};

export default MyMapApp;
```

#### Advanced Map with External Location Control

```tsx
import React, { useState } from 'react';
import { StandaloneMapComponent } from 'geospatial-explorer-lib';

const AdvancedMapApp = () => {
  const [location, setLocation] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    searchString: 'New York City'
  });

  return (
    <div>
      <button onClick={() => setLocation({
        latitude: 51.5074,
        longitude: -0.1278,
        searchString: 'London, UK'
      })}>
        Go to London
      </button>
      
      <StandaloneMapComponent
        externalLocation={location}
        width="100%"
        height="500px"
        theme="light"
        className="border-2 border-gray-300"
        onLocationChange={(newLocation) => {
          setLocation(newLocation);
        }}
      />
    </div>
  );
};
```

#### Globe Component

```tsx
import React from 'react';
import { GlobeComponent } from 'geospatial-explorer-lib';

const MyGlobeApp = () => {
  return (
    <GlobeComponent
      width="100%"
      height="600px"
      options={{
        autoRotate: true,
        backgroundColor: '#000011'
      }}
      onLocationSelect={(location) => {
        console.log('Selected location:', location);
      }}
    />
  );
};
```

### Angular

#### Module Setup

First, import the module in your Angular application:

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

#### Standalone Component Usage (Recommended)

For modern Angular applications using standalone components:

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  AngularMapComponent, 
  AngularGlobeComponent,
  GeoLocation,
  MapViewOptions,
  GlobeOptions
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
        [enableDrawing]="true"
        (ready)="onMapReady($event)"
        (locationSelect)="onLocationSelected($event)"
        (annotationsChange)="onAnnotationsChange($event)">
      </geo-map>
      
      <!-- Globe Component -->
      <geo-globe
        [options]="globeOptions"
        [selectedLocation]="selectedLocation"
        [width]="'100%'"
        [height]="'600px'"
        (ready)="onGlobeReady($event)"
        (flyComplete)="onFlyComplete()"
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
  mapOptions: Partial<MapViewOptions> = {
    initialZoom: 10,
    enableControls: true
  };
  
  globeOptions: Partial<GlobeOptions> = {
    enableRotation: true,
    showAtmosphere: true
  };
  
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
  
  onAnnotationsChange(annotations: any[]) {
    console.log('Annotations changed:', annotations);
  }
  
  onFlyComplete() {
    console.log('Globe fly animation completed');
  }
}
```

#### Template Usage

```html
<!-- app.component.html -->
<div class="map-container">
  <geo-map
    [width]="'100%'"
    [height]="'400px'"
    [enableDrawing]="true"
    [selectedLocation]="currentLocation"
    (locationSelect)="onLocationSelect($event)"
    (annotationsChange)="onAnnotationsChange($event)"
    (ready)="onMapReady($event)">
  </geo-map>
</div>

<div class="globe-container">
  <geo-globe
    [width]="'100%'"
    [height]="'500px'"
    [options]="globeOptions"
    (locationSelect)="onLocationSelect($event)"
    (ready)="onGlobeReady($event)">
  </geo-globe>
</div>
```

#### Component Class

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { GeoLocation, GlobeOptions } from 'geospatial-explorer-lib/angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  currentLocation: GeoLocation | null = null;
  globeOptions: Partial<GlobeOptions> = {
    autoRotate: true,
    backgroundColor: '#000011',
    earthRadius: 5
  };

  onLocationSelect(location: GeoLocation) {
    console.log('Location selected:', location);
    this.currentLocation = location;
  }

  onAnnotationsChange(annotations: any[]) {
    console.log('Annotations changed:', annotations);
  }

  onMapReady(mapInstance: any) {
    console.log('Map is ready:', mapInstance);
  }

  onGlobeReady(globeInstance: any) {
    console.log('Globe is ready:', globeInstance);
  }
}
```

### React Native

#### Basic Setup

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapComponent, GlobeComponent } from 'geospatial-explorer-lib/react-native';

const MyReactNativeApp = () => {
  return (
    <View style={styles.container}>
      <MapComponent
        style={styles.map}
        options={{
          initialCenter: [40.7128, -74.0060],
          initialZoom: 10
        }}
        onLocationSelect={(location) => {
          console.log('Selected location:', location);
        }}
        onReady={(api) => {
          console.log('Map ready:', api);
        }}
      />
      
      <GlobeComponent
        style={styles.globe}
        options={{
          autoRotate: true,
          earthRadius: 5,
          backgroundColor: '#000011'
        }}
        onLocationSelect={(location) => {
          console.log('Selected location:', location);
        }}
        onReady={(api) => {
          console.log('Globe ready:', api);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  globe: {
    flex: 1,
  },
});

export default MyReactNativeApp;
```

#### Advanced React Native Usage

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapComponent } from 'geospatial-explorer-lib/react-native';
import type { GeoLocation } from 'geospatial-explorer-lib/react-native';

const AdvancedRNMapApp = () => {
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const predefinedLocations = [
    { id: 'nyc', label: 'New York', x: -74.0060, y: 40.7128 },
    { id: 'london', label: 'London', x: -0.1278, y: 51.5074 },
    { id: 'tokyo', label: 'Tokyo', x: 139.6917, y: 35.6895 }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Geospatial Explorer</Text>
        {selectedLocation && (
          <Text style={styles.locationText}>
            Selected: {selectedLocation.label}
          </Text>
        )}
      </View>
      
      <View style={styles.buttonsContainer}>
        {predefinedLocations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={styles.locationButton}
            onPress={() => setSelectedLocation(location)}
          >
            <Text style={styles.buttonText}>{location.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <MapComponent
        style={styles.map}
        selectedLocation={selectedLocation}
        options={{
          initialCenter: [40.7128, -74.0060],
          initialZoom: 8,
          maxZoom: 18
        }}
        onLocationSelect={(location) => {
          setSelectedLocation(location);
        }}
        onReady={() => {
          setIsMapReady(true);
          console.log('Map is ready');
        }}
        onError={(error) => {
          console.error('Map error:', error);
        }}
      />
      
      {!isMapReady && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading Map...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#6c757d',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#f8f9fa',
  },
  locationButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#007bff',
  },
});

export default AdvancedRNMapApp;
```

## API Reference

### Component Properties

#### React Components

| Component | Props | Description |
|-----------|-------|-------------|
| `StandaloneMapComponent` | `width`, `height`, `theme`, `enableDrawing`, `showInternalSearch`, `externalLocation` | Standalone map with full functionality |
| `MapComponent` | `options`, `selectedLocation`, `onReady`, `onLocationSelect` | Basic map component |
| `GlobeComponent` | `options`, `selectedLocation`, `onReady`, `onFlyComplete` | 3D globe component |

#### Angular Components

| Component | Inputs | Outputs | Description |
|-----------|--------|---------|-------------|
| `geo-map` | `[options]`, `[selectedLocation]`, `[width]`, `[height]`, `[enableDrawing]` | `(ready)`, `(locationSelect)`, `(annotationsChange)` | Interactive map component |
| `geo-globe` | `[options]`, `[selectedLocation]`, `[width]`, `[height]` | `(ready)`, `(flyComplete)`, `(locationSelect)` | 3D globe component |

#### React Native Components

| Component | Props | Description |
|-----------|-------|-------------|
| `MapComponent` | `style`, `options`, `selectedLocation`, `onLocationSelect`, `onReady` | WebView-based map for React Native |
| `GlobeComponent` | `style`, `options`, `selectedLocation`, `onReady`, `onFlyComplete` | WebView-based globe for React Native |

### Types

```typescript
interface GeoLocation {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
  z?: number; // altitude
  metadata?: Record<string, any>;
}

interface MapViewOptions {
  initialCenter?: [number, number];
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  tileProvider?: string;
  showControls?: boolean;
}

interface GlobeOptions {
  earthRadius?: number;
  backgroundColor?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
  texturePath?: string;
  bumpMapPath?: string;
  specularMapPath?: string;
}
```

### Events

#### React Events

```typescript
// Map Events
onLocationChange?: (location: LocationObject) => void;
onLocationSelect?: (location: GeoLocation) => void;
onAnnotationsChange?: (annotations: any[]) => void;
onDrawingCreated?: (drawing: any) => void;
onReady?: (api: any) => void;
onError?: (error: Error) => void;

// Globe Events
onReady?: (api: any) => void;
onFlyComplete?: () => void;
onError?: (error: Error) => void;
```

#### Angular Events

```typescript
// Map Component Outputs
@Output() ready = new EventEmitter();
@Output() locationSelect = new EventEmitter();
@Output() error = new EventEmitter();
@Output() annotationsChange = new EventEmitter();
@Output() drawingCreated = new EventEmitter();
@Output() regionClick = new EventEmitter();

// Globe Component Outputs
@Output() ready = new EventEmitter();
@Output() flyComplete = new EventEmitter();
@Output() error = new EventEmitter();
@Output() locationSelect = new EventEmitter();
```

## Advanced Features

### GeoJSON Export

```tsx
import { downloadEnhancedGeoJSON } from 'geospatial-explorer-lib';

// Export with current location
downloadEnhancedGeoJSON({
  searchLocation: currentLocation,
  includeSearchMetadata: true,
  filename: 'my-geospatial-data.geojson'
});
```

### Custom Drawing Tools

```tsx
import { useDrawingFileUpload, useHandleShapeCreation } from 'geospatial-explorer-lib';

const MyCustomDrawingComponent = () => {
  const { handleFileUpload } = useDrawingFileUpload();
  const { handleShapeCreation } = useHandleShapeCreation();
  
  // Custom drawing logic here
};
```

## Platform Requirements

### Browser Support
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### React Native Support
- React Native 0.60+
- iOS 11+
- Android API 21+

### Angular Support
- Angular 12+
- TypeScript 4.0+

## Installation Troubleshooting

### Angular Integration Issues

If you encounter build errors with Angular:

1. **Clear Angular cache:**
   ```bash
   ng cache clean
   ```

2. **Verify imports:**
   ```typescript
   // For standalone components
   import { AngularMapComponent, AngularGlobeComponent } from 'geospatial-explorer-lib/angular';
   
   // For module approach
   import { GeospatialExplorerModule } from 'geospatial-explorer-lib/angular';
   ```

3. **Check component usage:**
   ```html
   <!-- Correct selectors -->
   <geo-map [selectedLocation]="location"></geo-map>
   <geo-globe [options]="globeOptions"></geo-globe>
   ```

### React Native Setup

For React Native, additional dependencies may be required:

```bash
# For WebView support
npm install react-native-webview

# For iOS
cd ios && pod install
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact our support team.

## Changelog

### v0.1.7
- Added cross-platform support for React, Angular, and React Native
- Improved TypeScript definitions
- Enhanced drawing capabilities
- Added GeoJSON export functionality
- Performance optimizations

### v0.1.6
- Initial release with basic map and globe components
- React support
- Basic drawing tools
