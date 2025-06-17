
# Geospatial Explorer Library

A cross-platform geospatial mapping library that works with React, React Native, and Angular applications.

## Installation

```bash
npm install geospatial-explorer-lib
```

## Quick Start

### React

```tsx
import { StandaloneMapComponent } from 'geospatial-explorer-lib/react';

function App() {
  return (
    <StandaloneMapComponent
      externalLocation={{
        latitude: 40.7128,
        longitude: -74.0060,
        label: "New York City"
      }}
      onLocationChange={(location) => {
        console.log('Location changed:', location);
      }}
    />
  );
}
```

### React Native

```tsx
import { MapComponent } from 'geospatial-explorer-lib/react-native';

function App() {
  return (
    <MapComponent
      selectedLocation={{
        id: '1',
        label: 'NYC',
        x: -74.0060,
        y: 40.7128
      }}
      onReady={() => console.log('Map ready!')}
    />
  );
}
```

### Angular

```typescript
import { MapComponentAngular } from 'geospatial-explorer-lib/angular';

// Use in your Angular component template
// <geo-map [selectedLocation]="location" (ready)="onMapReady()"></geo-map>
```

## Core Features

- **Cross-platform**: Works with React, React Native, and Angular
- **TypeScript Support**: Full TypeScript definitions included
- **3D Globe**: Three.js-powered 3D globe visualization
- **2D Maps**: Leaflet-based 2D mapping
- **Drawing Tools**: Built-in annotation and drawing capabilities
- **GeoJSON Export**: Export annotations as GeoJSON
- **Location Search**: Integrated location search functionality

## API Reference

### StandaloneMapComponent (React)

```tsx
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
  onLocationChange?: (location: LocationChangeEvent) => void;
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

### Core Types

```typescript
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
```

## Examples

Check out the examples directory for complete implementation examples:

- React Web Application
- React Native Mobile App
- Angular Application

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

MIT License - see LICENSE file for details.
