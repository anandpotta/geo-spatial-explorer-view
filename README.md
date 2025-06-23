
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

First, import the module in your Angular application:

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GeospatialExplorerModule } from 'geospatial-explorer-lib';

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

Then use the components in your templates:

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

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { GeoLocation, GlobeOptions } from 'geospatial-explorer-lib';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  currentLocation: GeoLocation | null = null;
  globeOptions: GlobeOptions = {
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
      />
      
      <GlobeComponent
        style={styles.globe}
        options={{
          autoRotate: true,
          earthRadius: 5
        }}
        onLocationSelect={(location) => {
          console.log('Selected location:', location);
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

## API Reference

### StandaloneMapComponent Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `string` | `'100%'` | Component width |
| `height` | `string` | `'400px'` | Component height |
| `theme` | `'light' \| 'dark'` | `'light'` | Visual theme |
| `className` | `string` | `''` | Additional CSS classes |
| `enableDrawing` | `boolean` | `false` | Enable drawing tools |
| `showInternalSearch` | `boolean` | `true` | Show internal search UI |
| `externalLocation` | `LocationObject` | `undefined` | External location to display |
| `selectedLocation` | `GeoLocation` | `undefined` | Selected location marker |
| `options` | `MapViewOptions` | `{}` | Map configuration options |

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onLocationChange` | `(location: LocationObject) => void` | Fired when location changes |
| `onLocationSelect` | `(location: GeoLocation) => void` | Fired when user selects a location |
| `onAnnotationsChange` | `(annotations: any[]) => void` | Fired when annotations change |
| `onDrawingCreated` | `(drawing: any) => void` | Fired when a drawing is created |
| `onReady` | `(api: any) => void` | Fired when component is ready |
| `onError` | `(error: Error) => void` | Fired when an error occurs |

### Types

```typescript
interface LocationObject {
  latitude: number;
  longitude: number;
  searchString?: string;
}

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

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## React Native Support

- React Native 0.60+
- iOS 11+
- Android API 21+

## Angular Support

- Angular 12+
- TypeScript 4.0+

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
