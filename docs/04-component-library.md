# Component Library Documentation

## Overview

The GeoSpatial Explorer component library is organized into several categories, each serving specific purposes in the application architecture.

## Core Map Components

### LeafletMap
**Location**: `src/components/map/LeafletMap.tsx`

Primary 2D mapping component built on Leaflet.js.

```typescript
interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
  onLocationSelect?: (location: Location) => void;
  onClearAll?: () => void;
  onClearSelectedLocation?: () => void;
  showDownloadButton?: boolean;
  showSavedLocationsDropdown?: boolean;
}
```

**Key Features**:
- Interactive 2D mapping with zoom/pan
- Marker placement and management
- Drawing tools integration
- Location search and selection
- Export capabilities
- Configurable header controls

**Usage**:
```typescript
<LeafletMap
  selectedLocation={selectedLocation}
  onMapReady={handleMapReady}
  onLocationSelect={handleLocationSelect}
  showDownloadButton={true}
  showSavedLocationsDropdown={false}
/>
```

### MapHeader
**Location**: `src/components/map/header/MapHeader.tsx`

Header component containing map controls and navigation elements.

```typescript
interface MapHeaderProps {
  onLocationSelect: (position: [number, number]) => void;
  isMapReady?: boolean;
  showDownloadButton?: boolean;
  showSavedLocationsDropdown?: boolean;
}
```

**Key Features**:
- Conditional rendering of download button
- Conditional rendering of saved locations dropdown
- Map ready state detection
- Auto-positioning and responsive layout

**Usage**:
```typescript
<MapHeader
  onLocationSelect={handleLocationSelect}
  isMapReady={true}
  showDownloadButton={true}
  showSavedLocationsDropdown={false}
/>
```

### ThreeGlobeMap
**Location**: `src/components/map/ThreeGlobeMap.tsx`

3D globe visualization using Three.js.

```typescript
interface ThreeGlobeMapProps {
  selectedLocation?: Location;
  onMapReady?: (api: any) => void;
  onFlyComplete?: () => void;
}
```

**Key Features**:
- Interactive 3D earth globe
- Smooth camera animations
- Location highlighting
- Auto-rotation capabilities
- High-quality earth textures

### StandaloneMapComponent
**Location**: `src/lib/react/StandaloneMapComponent.tsx`

Self-contained map component for library usage with enhanced configuration options.

```typescript
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
  onLocationChange?: (location: any) => void;
  onAnnotationsChange?: (annotations: any[]) => void;
  onGeoJSONGenerated?: (geojson: any) => void;
  theme?: 'light' | 'dark';
  initialZoom?: number;
  defaultLocation?: { latitude: number; longitude: number };
}
```

**Key Features**:
- Standalone operation with minimal dependencies
- Configurable UI elements (search, download, saved locations)
- External location input support
- Real-time annotation monitoring
- Theme support
- Customizable dimensions

**Usage**:
```typescript
<StandaloneMapComponent
  externalLocation={{ latitude: 40.7128, longitude: -74.0060 }}
  showInternalSearch={true}
  showDownloadButton={false}
  showSavedLocationsDropdown={true}
  width="100%"
  height="500px"
  onLocationChange={handleLocationChange}
  onAnnotationsChange={handleAnnotationsChange}
/>
```

## Drawing and Annotation Components

### DrawingControls
**Location**: `src/components/map/DrawingControls.tsx`

Main container for drawing tool functionality.

**Features**:
- Shape creation (polygons, circles, rectangles)
- Edit mode for existing shapes
- Layer management
- Floor plan integration
- Image overlay support with clip masking

### DrawTools
**Location**: `src/components/map/DrawTools.tsx`

Low-level drawing tool implementation using Leaflet.Draw.

### Drawing Tool Buttons
- **DrawingToolButton**: Individual tool activation buttons
- **MapControls**: Tool bar container and organization

## Location Management Components

### LocationSearch
**Location**: `src/components/LocationSearch.tsx`

Geocoding search interface with autocomplete.

```typescript
interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
  className?: string;
}
```

**Features**:
- Real-time search suggestions
- Geographic coordinate display
- Result selection and navigation

### SavedLocationsDropdown
**Location**: `src/components/map/SavedLocationsDropdown.tsx`

Management interface for saved locations with conditional rendering support.

```typescript
interface SavedLocationsDropdownProps {
  onLocationSelect: (position: [number, number]) => void;
  isMapReady?: boolean;
}
```

**Features**:
- List all saved locations
- Quick navigation to saved locations
- Location editing and deletion
- Export functionality
- Map ready state awareness

### DownloadButton
**Location**: `src/components/map/header/DownloadButton.tsx`

GeoJSON export functionality with conditional rendering support.

```typescript
interface DownloadButtonProps {
  disabled?: boolean;
}
```

**Features**:
- GeoJSON file generation and download
- Data validation before download
- Visual feedback and error handling
- Disabled state management

### MarkerComponents
- **UserMarker**: Represents user-created location markers
- **TempMarker**: Temporary marker during placement
- **SelectedLocationMarker**: Highlights selected locations

## UI Foundation Components

### Shadcn/UI Components
**Location**: `src/components/ui/`

Complete set of reusable UI components built on Radix UI primitives.

#### Form Controls
- **Button**: Primary interaction element
- **Input**: Text input with variants
- **Select**: Dropdown selection
- **Checkbox**: Boolean input
- **Switch**: Toggle control

#### Layout Components
- **Card**: Content containers
- **Separator**: Visual dividers
- **Accordion**: Collapsible content
- **Tabs**: Tabbed interfaces

#### Feedback Components
- **Toast**: Notification system
- **Alert**: Important messages
- **Progress**: Loading indicators
- **Skeleton**: Loading placeholders

#### Navigation Components
- **Dropdown Menu**: Context menus
- **Command**: Search and command palette
- **Breadcrumb**: Navigation trails

## Custom Hooks Documentation

### useMapState
**Location**: `src/hooks/useMapState.ts`

Central state management for map-related data.

```typescript
export function useMapState(selectedLocation?: Location) {
  return {
    position: [number, number],
    zoom: number,
    markers: LocationMarker[],
    drawings: DrawingData[],
    tempMarker: [number, number] | null,
    // ... methods for state manipulation
  };
}
```

### useThreeGlobe
**Location**: `src/hooks/three/useThreeGlobe.ts`

Three.js globe management and lifecycle.

```typescript
export function useThreeGlobe(
  containerRef: React.RefObject<HTMLDivElement>,
  onInitialized?: () => void
) {
  return {
    scene: THREE.Scene | null,
    camera: THREE.Camera | null,
    globe: THREE.Group | null,
    isInitialized: boolean,
    flyToLocation: (lng: number, lat: number) => void,
  };
}
```

### useDrawingControls
**Location**: `src/hooks/useDrawingControls.ts`

Drawing tool state and operations management.

### useLocationSelection
**Location**: `src/hooks/useLocationSelection.ts`

Location selection and navigation logic.

### useSvgPathManagement
**Location**: `src/hooks/useSvgPathManagement.ts`

SVG path management for floor plan overlays and clip masking.

## Utility Components

### MapEvents
**Location**: `src/components/map/MapEvents.tsx`

Event handling for map interactions.

### FloorPlanView
**Location**: `src/components/map/FloorPlanView.tsx`

Floor plan overlay and management interface.

## Component Composition Patterns

### Container/Presentational Pattern
Many components follow the container/presentational pattern:

```typescript
// Container (logic)
const MapContainer = () => {
  const mapState = useMapState();
  const drawingControls = useDrawingControls();
  
  return (
    <MapView
      {...mapState}
      {...drawingControls}
      showDownloadButton={true}
      showSavedLocationsDropdown={true}
    />
  );
};

// Presentational (UI)
const MapView = ({ 
  position, 
  markers, 
  onMarkerClick,
  showDownloadButton,
  showSavedLocationsDropdown 
}) => {
  return (
    <div className="map-container">
      <MapHeader
        showDownloadButton={showDownloadButton}
        showSavedLocationsDropdown={showSavedLocationsDropdown}
      />
      {/* Other map content */}
    </div>
  );
};
```

### Compound Component Pattern
Complex components use compound patterns for flexibility:

```typescript
<DrawingControls>
  <DrawingControls.Toolbar>
    <DrawingControls.Tool type="polygon" />
    <DrawingControls.Tool type="circle" />
  </DrawingControls.Toolbar>
  <DrawingControls.Canvas>
    <DrawingControls.Layer />
  </DrawingControls.Canvas>
</DrawingControls>
```

## Configuration Examples

### Minimal Map with Download Only
```typescript
<StandaloneMapComponent
  showInternalSearch={false}
  showDownloadButton={true}
  showSavedLocationsDropdown={false}
  width="100%"
  height="400px"
/>
```

### Full-Featured Map
```typescript
<StandaloneMapComponent
  showInternalSearch={true}
  showDownloadButton={true}
  showSavedLocationsDropdown={true}
  externalLocation={{ latitude: 40.7128, longitude: -74.0060 }}
  onLocationChange={handleLocationChange}
  onAnnotationsChange={handleAnnotationsChange}
/>
```

### Custom Themed Map
```typescript
<StandaloneMapComponent
  theme="dark"
  showDownloadButton={false}
  showSavedLocationsDropdown={true}
  className="custom-map-styles"
/>
```

## Error Boundary Components

### MapErrorBoundary
Catches and handles map-related errors gracefully.

### GlobalErrorBoundary
Application-wide error handling and recovery.

## Component Performance Guidelines

### Memoization Strategy
- Use `React.memo` for pure components
- Use `useMemo` for expensive calculations
- Use `useCallback` for stable function references

### Lazy Loading
- Route-based code splitting
- Dynamic imports for heavy components
- Conditional rendering for optional features

### Re-render Optimization
- Minimize prop drilling
- Use context judiciously
- Implement shouldComponentUpdate logic where needed

## Recent Updates

### v1.2.0 - Enhanced Component Configuration
- Added `showDownloadButton` and `showSavedLocationsDropdown` props to MapHeader
- Updated StandaloneMapComponent with new configuration options
- Improved anonymous user support for clip mask operations
- Enhanced SVG path management for floor plan overlays
- Fixed authentication requirements for drawing annotations

### Breaking Changes
- MapHeader now requires explicit boolean props for header controls
- StandaloneMapComponent interface updated with new optional props
- Default behavior maintains backward compatibility (all controls shown by default)
