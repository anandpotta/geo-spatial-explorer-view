# GeoSpatial Explorer Library

A cross-platform geospatial library supporting React, React Native, and Angular applications.

## Installation

```bash
npm install geospatial-explorer-lib
```

## Usage

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

### Angular

```typescript
import { MapComponentAngular } from 'geospatial-explorer-lib/angular';

// Use in your Angular module
```

## API Reference

### Core Types

- `GeoLocation`: Represents a geographic location
- `MapViewOptions`: Configuration options for map components
- `GlobeOptions`: Configuration options for globe components

### Utilities

- `calculateDistance(lat1, lng1, lat2, lng2)`: Calculate distance between two points
- `formatCoordinate(coord, type)`: Format coordinates for display
- `isWeb()`: Check if running in web environment
- `isReactNative()`: Check if running in React Native environment

## License

MIT
