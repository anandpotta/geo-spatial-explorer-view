
# API Reference

## Core Library API

### MapCore Class

The `MapCore` class provides platform-agnostic mapping functionality.

```typescript
class MapCore {
  constructor(options: MapCoreOptions);
  
  // Initialization
  init(config: MapInitConfig): void;
  dispose(): void;
  
  // Location management
  addMarker(marker: GeoLocation): void;
  removeMarker(markerId: string): void;
  flyToLocation(longitude: number, latitude: number): void;
  
  // Drawing operations
  enableDrawing(type: DrawingType): void;
  disableDrawing(): void;
  
  // Event handling
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}
```

#### MapCoreOptions
```typescript
interface MapCoreOptions {
  initialZoom?: number;
  initialCenter?: [number, number];
  enableDrawing?: boolean;
  theme?: 'light' | 'dark';
}
```

#### MapInitConfig
```typescript
interface MapInitConfig {
  getElement: () => HTMLElement;
  getDimensions: () => { width: number; height: number };
  onResize: (callback: () => void) => () => void;
  onCleanup: (callback: () => void) => void;
}
```

### ThreeGlobeCore Class

3D globe functionality for cross-platform usage.

```typescript
class ThreeGlobeCore {
  constructor(options: GlobeOptions);
  
  // Initialization
  init(container: HTMLElement): void;
  dispose(): void;
  
  // Navigation
  flyToLocation(longitude: number, latitude: number, onComplete?: () => void): void;
  setAutoRotation(enabled: boolean): void;
  
  // Appearance
  setTextureQuality(quality: 'low' | 'medium' | 'high'): void;
  setAtmosphereVisible(visible: boolean): void;
}
```

## React Components API

### StandaloneMapComponent

Self-contained map component for embedding in React applications.

```typescript
interface StandaloneMapProps {
  // External location input
  externalLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
    label?: string;
  };
  
  // Component configuration
  showInternalSearch?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  
  // Callbacks
  onLocationChange?: (location: LocationChangeEvent) => void;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  onGeoJSONGenerated?: (geojson: GeoJSON) => void;
  
  // Styling
  theme?: 'light' | 'dark';
  
  // Initial map settings
  initialZoom?: number;
  defaultLocation?: {
    latitude: number;
    longitude: number;
  };
}
```

#### Event Types
```typescript
interface LocationChangeEvent {
  latitude: number;
  longitude: number;
  searchString?: string;
}

interface Annotation {
  type: 'marker' | 'drawing';
  id: string;
  properties: Record<string, any>;
  searchLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
  };
}
```

### MapComponent

Basic map component for React applications.

```typescript
interface MapComponentProps {
  options?: MapViewOptions;
  onLocationSelect?: (location: GeoLocation) => void;
  onMapReady?: (api: MapAPI) => void;
}

interface MapViewOptions {
  initialZoom?: number;
  initialCenter?: [number, number];
  enableDrawing?: boolean;
  showControls?: boolean;
}
```

### GlobeComponent

3D globe component for React applications.

```typescript
interface GlobeComponentProps {
  options?: GlobeOptions;
  onReady?: (api: GlobeAPI) => void;
  selectedLocation?: GeoLocation;
  onLocationSelect?: (location: GeoLocation) => void;
}

interface GlobeOptions {
  earthRadius?: number;
  autoRotate?: boolean;
  textureQuality?: 'low' | 'medium' | 'high';
  showAtmosphere?: boolean;
}
```

## Data Types

### Core Types

```typescript
interface GeoLocation {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
  description?: string;
}

interface LocationMarker extends GeoLocation {
  name: string;
  position: [number, number];
  type: 'pin' | 'area' | 'building';
  createdAt: Date;
  userId: string;
  associatedDrawing?: string;
}

interface DrawingData {
  id: string;
  type: 'polygon' | 'circle' | 'rectangle' | 'marker';
  coordinates: Array<[number, number]>;
  geoJSON?: GeoJSON.Feature;
  svgPath?: string;
  properties: {
    name?: string;
    description?: string;
    color?: string;
    createdAt: Date;
    associatedMarkerId?: string;
  };
  userId: string;
}
```

### Enhanced Types

```typescript
interface EnhancedLocation extends GeoLocation {
  x: number; // longitude
  y: number; // latitude
  searchString?: string;
  timestamp?: string;
  source?: string;
  raw?: any;
}

interface StandaloneGeoJSON {
  type: 'FeatureCollection';
  features: StandaloneGeoJSONFeature[];
  properties: {
    generatedAt: string;
    exportedBy: string;
    searchLocation?: {
      latitude: number;
      longitude: number;
      searchString?: string;
    };
  };
}
```

## Utility Functions API

### Geographic Utilities

```typescript
// Distance calculation
function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number;

// Coordinate formatting
function formatCoordinate(
  coordinate: number, 
  type: 'latitude' | 'longitude',
  precision?: number
): string;

// Bounds calculation
function calculateBounds(locations: GeoLocation[]): {
  north: number;
  south: number;
  east: number;
  west: number;
};
```

### Location Search

```typescript
interface LocationSearchOptions {
  query: string;
  limit?: number;
  bounds?: BoundingBox;
  countryCode?: string;
}

interface SearchResult {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
  bounds?: [number, number, number, number];
  raw: any;
}

function searchLocations(
  options: LocationSearchOptions
): Promise<SearchResult[]>;
```

### Export Utilities

```typescript
// Enhanced GeoJSON export
function generateEnhancedGeoJSON(options: {
  selectedLocation?: EnhancedLocation;
  annotations?: Annotation[];
  includeMetadata?: boolean;
}): StandaloneGeoJSON;

// Download functionality
function downloadEnhancedGeoJSON(
  geoJSON: StandaloneGeoJSON,
  filename?: string
): void;

// String conversion
function getEnhancedGeoJSONString(
  geoJSON: StandaloneGeoJSON,
  pretty?: boolean
): string;
```

### Storage Utilities

```typescript
// Marker storage
function saveMarker(marker: LocationMarker): void;
function getSavedMarkers(): LocationMarker[];
function deleteMarker(markerId: string): void;
function renameMarker(markerId: string, newName: string): void;

// Drawing storage
function saveDrawing(drawing: DrawingData): void;
function getSavedDrawings(): DrawingData[];
function deleteDrawing(drawingId: string): void;

// Floor plan storage
function saveFloorPlan(drawingId: string, imageData: string): void;
function getFloorPlanById(drawingId: string): string | null;
function hasFloorPlan(drawingId: string): boolean;
```

## Event System API

### Custom Events

The application uses a custom event system for cross-component communication.

```typescript
// Event types
type AppEvent = 
  | 'markersUpdated'
  | 'drawingsUpdated'
  | 'floorPlanUpdated'
  | 'locationSelected'
  | 'mapRefresh';

// Event dispatcher
function dispatchAppEvent(eventType: AppEvent, detail?: any): void;

// Event listener
function addAppEventListener(
  eventType: AppEvent, 
  handler: (event: CustomEvent) => void
): () => void;
```

### Map Events

```typescript
interface MapEventHandlers {
  onMapReady?: (map: L.Map) => void;
  onLocationSelect?: (position: [number, number]) => void;
  onMapClick?: (latlng: L.LatLng) => void;
  onShapeCreated?: (shape: any) => void;
  onShapeEdited?: (shape: any) => void;
  onShapeDeleted?: (shape: any) => void;
}
```

## Error Handling API

```typescript
interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Error handling utilities
function handleMapError(error: Error): void;
function handleApiError(error: Error): void;
function reportError(error: AppError): void;
```

## Configuration API

### Application Configuration

```typescript
interface AppConfig {
  map: {
    defaultZoom: number;
    defaultCenter: [number, number];
    maxZoom: number;
    minZoom: number;
  };
  globe: {
    earthRadius: number;
    autoRotateSpeed: number;
    animationDuration: number;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  features: {
    enableDrawing: boolean;
    enableExport: boolean;
    enableSync: boolean;
  };
}
```

### Theme Configuration

```typescript
interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
  };
  map: {
    tileUrl: string;
    attribution: string;
  };
  globe: {
    backgroundColor: string;
    atmosphereColor: string;
  };
}
```

## Platform-Specific APIs

### React Native Adaptations

```typescript
interface ReactNativeMapProps extends MapComponentProps {
  style?: ViewStyle;
  gestureHandling?: 'greedy' | 'cooperative' | 'none';
}
```

### Angular Integrations

```typescript
@Injectable()
class MapService {
  createMap(config: MapConfig): Observable<MapInstance>;
  destroyMap(mapId: string): void;
  addMarker(mapId: string, marker: LocationMarker): void;
}
```
