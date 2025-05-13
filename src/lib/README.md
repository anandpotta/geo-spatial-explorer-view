
# GeoSpatial Explorer Library

A cross-platform library for 3D globe and map visualizations that works on:
- Web (React)
- Mobile (React Native)
- Angular applications

## Installation

```bash
npm install geospatial-explorer-lib
```

## Usage

### React Web Application

```jsx
import { ReactComponents } from 'geospatial-explorer-lib';

const { GlobeComponent } = ReactComponents;

function App() {
  const location = {
    id: 'nyc',
    label: 'New York City',
    x: -74.006, // longitude
    y: 40.7128  // latitude
  };

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <GlobeComponent 
        selectedLocation={location}
        onReady={() => console.log('Globe is ready')}
        onFlyComplete={() => console.log('Flight animation completed')}
      />
    </div>
  );
}
```

### React Native Application

```jsx
import { ReactNativeComponents } from 'geospatial-explorer-lib';

const { GlobeComponent } = ReactNativeComponents;

function GlobeScreen() {
  const location = {
    id: 'nyc',
    label: 'New York City',
    x: -74.006, // longitude
    y: 40.7128  // latitude
  };

  return (
    <View style={{ flex: 1 }}>
      <GlobeComponent 
        selectedLocation={location}
        onReady={() => console.log('Globe is ready')}
        onFlyComplete={() => console.log('Flight animation completed')}
      />
    </View>
  );
}
```

### Angular Application

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GeoSpatialExplorerModule } from 'geospatial-explorer-lib-angular';

@NgModule({
  imports: [
    BrowserModule,
    GeoSpatialExplorerModule
  ],
  // ...
})
export class AppModule { }

// app.component.ts
@Component({
  selector: 'app-root',
  template: `
    <div style="width: 100%; height: 500px;">
      <app-globe 
        [selectedLocation]="location"
        (ready)="onGlobeReady($event)"
        (flyComplete)="onFlyComplete()">
      </app-globe>
    </div>
  `
})
export class AppComponent {
  location = {
    id: 'nyc',
    label: 'New York City',
    x: -74.006,
    y: 40.7128
  };

  onGlobeReady(api: any) {
    console.log('Globe is ready');
  }

  onFlyComplete() {
    console.log('Flight animation completed');
  }
}
```

## API Reference

### Common Types

```typescript
// Core location type
interface GeoLocation {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
  z?: number; // optional altitude
  metadata?: Record<string, any>;
}

// Globe configuration options
interface GlobeOptions {
  earthRadius?: number;
  texturePath?: string;
  bumpMapPath?: string;
  specularMapPath?: string;
  backgroundColor?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

// Map view options
interface MapViewOptions {
  initialCenter?: [number, number];
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  tileProvider?: string;
  showControls?: boolean;
}
```

### Globe Component Props

```typescript
interface GlobeComponentProps {
  options?: Partial<GlobeOptions>;
  selectedLocation?: GeoLocation;
  onReady?: (api: any) => void;
  onFlyComplete?: () => void;
  onError?: (error: Error) => void;
}
```

### Map Component Props

```typescript
interface MapComponentProps {
  options?: Partial<MapViewOptions>;
  selectedLocation?: GeoLocation;
  onReady?: (api: any) => void;
  onLocationSelect?: (location: GeoLocation) => void;
  onError?: (error: Error) => void;
}
```

## Platform-Specific Considerations

### React Native
- Requires `react-native-webview` dependency
- For best performance, use a device with good WebGL support

### Angular
- Install the companion package `geospatial-explorer-lib-angular`
- Angular 13+ is required

## License

MIT
