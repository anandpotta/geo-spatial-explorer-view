
# Geospatial Explorer Library

A cross-platform geospatial library for React, React Native, and Angular applications with advanced 2D/3D mapping capabilities.

## Installation

```bash
npm install geospatial-explorer-lib
```

## Usage

### Angular

```typescript
// app.module.ts
import { GeospatialExplorerModule } from 'geospatial-explorer-lib/angular';

@NgModule({
  imports: [
    CommonModule,
    GeospatialExplorerModule
  ],
  // ...
})
export class AppModule { }
```

```html
<!-- app.component.html -->
<geo-map 
  [options]="mapOptions" 
  [selectedLocation]="location"
  (ready)="onMapReady($event)"
  (locationSelect)="onLocationSelect($event)">
</geo-map>

<geo-globe 
  [options]="globeOptions" 
  [selectedLocation]="location"
  (ready)="onGlobeReady($event)"
  (flyComplete)="onFlyComplete()">
</geo-globe>
```

### React

```typescript
import { MapComponent, GlobeComponent } from 'geospatial-explorer-lib/react';

function App() {
  return (
    <div>
      <MapComponent 
        options={mapOptions}
        selectedLocation={location}
        onReady={handleMapReady}
      />
      <GlobeComponent 
        options={globeOptions}
        selectedLocation={location}
        onReady={handleGlobeReady}
      />
    </div>
  );
}
```

### React Native

```typescript
import { MapComponent, GlobeComponent } from 'geospatial-explorer-lib/react-native';

export default function App() {
  return (
    <View>
      <MapComponent 
        options={mapOptions}
        selectedLocation={location}
        onReady={handleMapReady}
      />
    </View>
  );
}
```

## Features

- 🗺️ **Cross-platform** - Works with React, React Native, and Angular
- 🌍 **3D Globe** - Interactive 3D earth visualization
- 🗺️ **2D Maps** - Leaflet-based 2D mapping
- ✏️ **Drawing Tools** - Advanced annotation and drawing capabilities
- 📱 **Mobile Ready** - Optimized for mobile devices
- 🎨 **Customizable** - Extensive theming and styling options
- 📦 **TypeScript** - Full TypeScript support

## API Reference

### Types

```typescript
interface GeoLocation {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
  z?: number; // altitude
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
  texturePath?: string;
  backgroundColor?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
}
```

## License

MIT
