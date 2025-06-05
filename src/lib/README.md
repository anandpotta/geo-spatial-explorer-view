
# GeoSpatial Explorer Library

A cross-platform geospatial visualization library supporting React, Angular, and React Native.

## Features

- **3D Globe View**: Three.js-powered interactive globe
- **2D Map View**: Leaflet-based mapping with drawing tools
- **Cross-Platform**: React, Angular, and React Native support
- **Drawing Tools**: Shape creation, editing, and floor plan overlays
- **Location Search**: Integrated location search and selection
- **Cloud Sync**: Azure SQL integration for data persistence

## Installation

```bash
npm install @your-org/geospatial-explorer
```

## Quick Start

### React

```tsx
import React from 'react';
import { GeoSpatialExplorer } from '@your-org/geospatial-explorer/react';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GeoSpatialExplorer
        selectedLocation={{
          id: '1',
          x: -74.0060,
          y: 40.7128,
          label: 'New York City'
        }}
        onLocationSelect={(location) => {
          console.log('Selected:', location);
        }}
      />
    </div>
  );
}
```

### Angular

```typescript
// app.module.ts
import { GeospatialModule } from '@your-org/geospatial-explorer/angular';

@NgModule({
  imports: [GeospatialModule],
  // ...
})
export class AppModule { }
```

```html
<!-- component.html -->
<geo-spatial-explorer 
  [selectedLocation]="location"
  (locationSelect)="onLocationSelect($event)">
</geo-spatial-explorer>
```

### React Native

```tsx
import { GeoSpatialExplorerNative } from '@your-org/geospatial-explorer/react-native';

export default function App() {
  return (
    <GeoSpatialExplorerNative
      selectedLocation={location}
      onLocationSelect={handleLocationSelect}
    />
  );
}
```

## API Reference

### Components

#### GeoSpatialExplorer (React)
- `selectedLocation?: GeoLocation` - Currently selected location
- `onLocationSelect?: (location: GeoLocation) => void` - Location selection callback
- `onMapReady?: () => void` - Map ready callback

#### Core Types

```typescript
interface GeoLocation {
  id: string;
  x: number; // longitude
  y: number; // latitude
  label: string;
  z?: number; // altitude
}
```

## Building the Package

```bash
npm run build
```

## Publishing

```bash
npm publish
```

## License

MIT
