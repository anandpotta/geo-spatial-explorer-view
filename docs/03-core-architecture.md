# Core Architecture

## System Design Overview

The GeoSpatial Explorer follows a layered architecture with clear separation between presentation, business logic, and data management. This design enables maintainability, testability, and cross-platform compatibility.

## Architectural Layers

### 1. Presentation Layer
**Location**: `src/components/`

The presentation layer handles all user interface concerns and user interactions.

#### Key Components:
- **GeoSpatialExplorer**: Main application orchestrator
- **LeafletMap**: 2D mapping interface
- **ThreeGlobeMap**: 3D globe visualization
- **LocationSearch**: Geocoding and location discovery
- **DrawingControls**: Interactive drawing tools

#### Responsibilities:
- Rendering UI components
- Handling user interactions
- Managing component-level state
- Delegating business logic to custom hooks

### 2. Business Logic Layer
**Location**: `src/hooks/`, `src/utils/`

This layer contains all business rules, calculations, and stateful logic.

#### Custom Hooks:
```typescript
// Example hook structure
export function useMapState(selectedLocation?: Location) {
  const [position, setPosition] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.y, selectedLocation.x] : [51.505, -0.09]
  );
  const [zoom, setZoom] = useState(18);
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('building');
  const [currentDrawing, setCurrentDrawing] = useState<DrawingData | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingData | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Load existing markers and drawings
  useEffect(() => {
    console.log('Loading data');
    
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    
    const savedDrawings = getSavedDrawings();
    setDrawings(savedDrawings);
    
    // Listen for marker updates
    const handleMarkersUpdated = () => {
      setMarkers(getSavedMarkers());
    };

    // Listen for drawing updates
    const handleDrawingsUpdated = () => {
      setDrawings(getSavedDrawings());
    };
    
    // Listen for floor plan updates
    const handleFloorPlanUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.drawingId) {
        console.log(`Floor plan updated for drawing ${customEvent.detail.drawingId}, triggering refresh`);
        // Trigger a refresh of the drawings
        handleDrawingsUpdated();
      }
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('drawingsUpdated', handleDrawingsUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    window.addEventListener('storage', handleDrawingsUpdated);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('drawingsUpdated', handleDrawingsUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
      window.removeEventListener('storage', handleDrawingsUpdated);
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []);

  // Set up global position update handler for draggable markers
  useEffect(() => {
    window.tempMarkerPositionUpdate = setTempMarker;
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  const handleSaveMarker = () => {
    if (!tempMarker || !markerName.trim()) return;
    
    const newMarker: LocationMarker = {
      id: uuidv4(),
      name: markerName,
      position: tempMarker,
      type: markerType,
      createdAt: new Date(),
      associatedDrawing: currentDrawing ? currentDrawing.id : undefined,
      userId: 'anonymous' // Default user since we removed auth
    };
    
    // Clear the temporary marker BEFORE saving to prevent duplicate rendering
    setTempMarker(null);
    
    // Save the marker
    saveMarker(newMarker);
    
    if (currentDrawing) {
      // Create a safe copy of currentDrawing without circular references
      const safeDrawing: DrawingData = {
        ...currentDrawing,
        // Remove any potential circular references from geoJSON
        geoJSON: currentDrawing.geoJSON ? JSON.parse(JSON.stringify({
          type: currentDrawing.geoJSON.type,
          geometry: currentDrawing.geoJSON.geometry,
          properties: currentDrawing.geoJSON.properties
        })) : undefined,
        properties: {
          ...currentDrawing.properties,
          name: markerName,
          associatedMarkerId: newMarker.id
        },
        userId: 'anonymous'
      };
      
      // Save or update the drawing but don't clear it from the map
      saveDrawing(safeDrawing);
    }
    
    // Clear and reset UI state
    setMarkerName('');
    
    // Update the markers state with the new marker - use getSavedMarkers to ensure deduplication
    setMarkers(getSavedMarkers());
    
    toast.success("Location saved successfully");
    
    // Ensure drawings remain visible by dispatching a custom event
    window.dispatchEvent(new Event('drawingsUpdated'));
    
    // Clean up any leftover temporary marker DOM elements after a slight delay
    setTimeout(() => {
      if (tempMarker) {
        const markerId = `temp-marker-${tempMarker[0]}-${tempMarker[1]}`;
        const tempIcons = document.querySelectorAll(`.leaflet-marker-icon[data-marker-id="${markerId}"], .leaflet-marker-shadow[data-marker-id="${markerId}"]`);
        tempIcons.forEach(icon => {
          if (icon.parentNode) {
            icon.parentNode.removeChild(icon);
          }
        });
      }
    }, 100);
  };

  const handleDeleteMarker = (id: string) => {
    deleteMarker(id);
    // Update the markers state
    setMarkers(markers.filter(marker => marker.id !== id));
    toast.success("Location removed");
  };

  const handleRenameMarker = (id: string, newName: string) => {
    renameMarker(id, newName);
    // Update the markers state
    setMarkers(getSavedMarkers());
  };

  const handleRegionClick = (drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  };

  return {
    position,
    setPosition,
    zoom,
    setZoom,
    markers,
    setMarkers,
    drawings,
    setDrawings,
    tempMarker,
    setTempMarker,
    markerName,
    setMarkerName,
    markerType,
    setMarkerType,
    currentDrawing,
    setCurrentDrawing,
    showFloorPlan,
    setShowFloorPlan,
    selectedDrawing,
    setSelectedDrawing,
    activeTool,
    setActiveTool,
    handleSaveMarker,
    handleDeleteMarker,
    handleRenameMarker,
    handleRegionClick
  };
}
```

#### Utility Functions:
- **geo-utils.ts**: Geographic calculations and transformations
- **marker-utils.ts**: Marker creation, storage, and management
- **drawing-utils.ts**: Drawing operations and persistence
- **svg-utils.ts**: SVG manipulation and path operations

### 3. Data Layer
**Location**: `src/services/`, `src/utils/*/storage.ts`

Manages data persistence, API communications, and caching.

#### Storage Strategy:
```typescript
// Local storage with sync capabilities
interface StorageService {
  saveMarker(marker: LocationMarker): void;
  getSavedMarkers(): LocationMarker[];
  syncWithBackend(): Promise<void>;
}
```

## Cross-Platform Library Architecture

### Core Library Structure
**Location**: `src/lib/`

```
lib/
├── geospatial-core/     # Platform-agnostic core
│   ├── globe/          # 3D globe functionality
│   ├── map/            # 2D map functionality
│   ├── types/          # Type definitions
│   └── utils/          # Utility functions
├── react/              # React-specific implementations
├── react-native/       # React Native adaptations
└── angular/            # Angular wrappers
```

### Platform Abstraction Pattern

The library uses platform abstraction to provide consistent APIs across different frameworks:

```typescript
// Core interface (platform-agnostic)
interface MapCore {
  init(config: MapConfig): void;
  addMarker(marker: GeoLocation): void;
  dispose(): void;
}

// React implementation
export function MapComponent(props: MapProps) {
  const mapCore = useRef<MapCore>();
  // React-specific lifecycle and state management
}

// Angular implementation
export class MapComponentAngular implements OnInit, OnDestroy {
  private mapCore: MapCore;
  // Angular-specific lifecycle and dependency injection
}
```

## State Management Strategy

### Local Component State
- Used for UI-specific state (form inputs, toggle states)
- Managed with `useState` and `useReducer`

### Shared State (Context)
- Authentication state
- Global settings and preferences
- Cross-component communication

### Persistent State
- Location markers and drawings
- User preferences
- Cached map data

### State Flow Diagram
```
User Interaction
       ↓
Component Event Handler
       ↓
Custom Hook (Business Logic)
       ↓
Utility Function (Data Operation)
       ↓
Storage Service (Persistence)
       ↓
State Update
       ↓
Component Re-render
```

## Event System

### Component Communication
The application uses several patterns for component communication:

1. **Props Down, Events Up**: Standard React pattern
2. **Custom Events**: For cross-component notifications
3. **Context Providers**: For global state sharing

### Custom Event Examples
```typescript
// Drawing created event
window.dispatchEvent(new CustomEvent('drawingCreated', {
  detail: { drawingId: 'drawing-123' }
}));

// Storage updated event
window.dispatchEvent(new Event('markersUpdated'));
```

## Performance Optimizations

### Rendering Optimizations
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Expensive calculations and stable references
- **Virtualization**: For large lists of markers/drawings

### Map Optimizations
- **Lazy Loading**: Load map tiles and assets on demand
- **Debouncing**: Reduce API calls during user interactions
- **Caching**: Store frequently accessed data

### Memory Management
- **Cleanup Functions**: Proper disposal of resources
- **Event Listener Removal**: Prevent memory leaks
- **Three.js Resource Disposal**: Explicit geometry/material cleanup

## Error Handling Strategy

### Error Boundaries
React error boundaries catch and handle component errors gracefully.

### Async Error Handling
```typescript
export async function safeApiCall<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('API call failed:', error);
    return fallback;
  }
}
```

### User Feedback
- Toast notifications for operation results
- Loading states for async operations
- Error messages with actionable information

## Security Considerations

### Data Sanitization
- Input validation for user-generated content
- XSS prevention in dynamic content
- Safe parsing of external data

### API Security
- Authentication token management
- CORS configuration
- Rate limiting and request validation

## Scalability Patterns

### Code Splitting
- Route-based splitting for different views
- Component-based splitting for large features
- Dynamic imports for optional functionality

### Modular Architecture
- Feature-based folder organization
- Plugin-style component registration
- Configurable functionality through props/options
