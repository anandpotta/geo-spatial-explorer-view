
# Libraries and Dependencies

## Core Framework Dependencies

### React Ecosystem
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2"
}
```

**React 18** provides the foundation with:
- Concurrent rendering features
- Automatic batching for better performance
- Strict mode for development
- Suspense for data fetching

**React Router** handles:
- Client-side routing
- Navigation management
- Route-based code splitting

### TypeScript Configuration
```json
{
  "@types/react": ">=16.8.0",
  "@types/react-dom": ">=16.8.0",
  "typescript": ">=4.5.0"
}
```

Full TypeScript implementation with:
- Strict type checking enabled
- Interface definitions for all data structures
- Generic types for reusable components

## Mapping and Geospatial Libraries

### Leaflet.js Stack
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "leaflet-draw": "^1.0.4",
  "react-leaflet-draw": "^0.20.6",
  "leaflet-geosearch": "^3.11.1",
  "@types/leaflet": "^1.9.8",
  "@types/leaflet-draw": "^1.0.10"
}
```

**Leaflet** (Primary 2D Mapping):
- High-performance interactive maps
- Mobile-friendly touch interactions
- Plugin ecosystem for extensions
- Lightweight and customizable

**React-Leaflet** (React Integration):
- Declarative React components for Leaflet
- Lifecycle management
- Event handling integration

**Leaflet-Draw** (Drawing Tools):
- Interactive shape drawing
- Edit/delete functionality
- Polygon, circle, rectangle tools
- Custom shape support

**Leaflet-GeoSearch** (Location Search):
- Geocoding and reverse geocoding
- Multiple provider support
- Autocomplete functionality

### Three.js (3D Graphics)
```json
{
  "three": "^0.133.1",
  "@types/three": "^0.133.0"
}
```

**Three.js Features Used**:
- WebGL-based 3D rendering
- Earth globe with realistic textures
- Orbital camera controls
- Lighting and atmosphere effects
- Performance optimizations

**Custom Three.js Implementation**:
```typescript
// Globe factory pattern
export const createEarthGlobe = (scene: THREE.Scene) => {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 32);
  const material = new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.05
  });
  return new THREE.Mesh(geometry, material);
};
```

## UI Component Libraries

### Shadcn/UI + Radix UI
```json
{
  "@radix-ui/react-accordion": "^1.2.0",
  "@radix-ui/react-alert-dialog": "^1.1.1",
  "@radix-ui/react-avatar": "^1.1.0",
  "@radix-ui/react-checkbox": "^1.1.1",
  "@radix-ui/react-dialog": "^1.1.2",
  "@radix-ui/react-dropdown-menu": "^2.1.1",
  "@radix-ui/react-popover": "^1.1.1",
  "@radix-ui/react-select": "^2.1.1",
  "@radix-ui/react-tabs": "^1.1.0",
  "@radix-ui/react-toast": "^1.2.1"
}
```

**Design System Benefits**:
- Accessible by default
- Consistent theming
- Customizable styling
- TypeScript support
- WAI-ARIA compliance

### Styling Framework
```json
{
  "tailwindcss": "latest",
  "tailwindcss-animate": "^1.0.7",
  "tailwind-merge": "^3.3.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1"
}
```

**Tailwind CSS Configuration**:
- Utility-first CSS framework
- Custom design tokens
- Responsive design utilities
- Animation system
- Dark mode support

## Data Management Libraries

### Query and State Management
```json
{
  "@tanstack/react-query": "^5.56.2"
}
```

**TanStack Query Features**:
- Server state synchronization
- Caching and background updates
- Error handling and retries
- Optimistic updates

### Form Handling
```json
{
  "react-hook-form": "^7.53.0",
  "@hookform/resolvers": "^3.9.0",
  "zod": "^3.23.8"
}
```

**Form Management Stack**:
- Type-safe form validation
- Minimal re-renders
- Built-in error handling
- Schema validation with Zod

## Utility Libraries

### Date and Time
```json
{
  "date-fns": "^3.6.0"
}
```

**Date-fns Features**:
- Modular date utility functions
- TypeScript support
- Tree-shakeable
- Locale support

### Unique Identifiers
```json
{
  "uuid": "^11.1.0",
  "@types/uuid": "^9.0.3"
}
```

### Lodash Utilities
```json
{
  "lodash": "^4.17.21",
  "@types/lodash": "^4.17.16"
}
```

**Selected Lodash Functions**:
- Data manipulation utilities
- Deep cloning and merging
- Array and object helpers
- Performance-optimized operations

## Icon and Asset Libraries

### Lucide React Icons
```json
{
  "lucide-react": "^0.462.0"
}
```

**Icon System**:
- Consistent design language
- Tree-shakeable imports
- Customizable styling
- TypeScript definitions

### Chart and Visualization
```json
{
  "recharts": "^2.12.7"
}
```

**Recharts Features**:
- React-based charting library
- Responsive charts
- Animation support
- Customizable components

## Development and Build Tools

### Build System
```json
{
  "vite": "latest",
  "typescript": "^5.0.0",
  "eslint": "latest"
}
```

**Vite Configuration**:
- Fast development server
- Hot module replacement
- Optimized production builds
- Plugin ecosystem

### Notifications
```json
{
  "sonner": "^1.5.0"
}
```

**Toast Notification System**:
- Promise-based toasts
- Customizable styling
- Queue management
- Accessibility features

## Cross-Platform Library Dependencies

### Platform Detection
```typescript
// Custom utility for platform detection
export const isWeb = () => typeof window !== 'undefined';
export const isReactNative = () => typeof navigator !== 'undefined' && 
  navigator.product === 'ReactNative';
```

### Angular Integration
```json
{
  "@angular/core": ">=13.0.0"
}
```

**Angular Support**:
- Component wrappers
- Service integrations
- TypeScript compatibility
- Dependency injection

### React Native Integration
```json
{
  "react-native": ">=0.60.0",
  "react-native-webview": ">=11.0.0"
}
```

## Server Dependencies
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "body-parser": "^1.20.2"
}
```

**Backend Features**:
- REST API endpoints
- CORS configuration
- Request body parsing
- Static file serving

## Library Integration Patterns

### Leaflet Custom Integration
```typescript
// Custom hook for Leaflet integration
export const useLeafletMap = (containerRef: RefObject<HTMLDivElement>) => {
  const [map, setMap] = useState<L.Map | null>(null);
  
  useEffect(() => {
    if (containerRef.current && !map) {
      const leafletMap = L.map(containerRef.current);
      setMap(leafletMap);
    }
    
    return () => {
      map?.remove();
    };
  }, [containerRef, map]);
  
  return map;
};
```

### Three.js Resource Management
```typescript
// Proper disposal of Three.js resources
export const disposeObject3D = (object: THREE.Object3D) => {
  if (object.geometry) object.geometry.dispose();
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach(material => material.dispose());
    } else {
      object.material.dispose();
    }
  }
};
```

## Performance Optimization Libraries

### Bundle Analysis
```json
{
  "rollup-plugin-analyzer": "latest"
}
```

### Code Splitting
```typescript
// Dynamic imports for code splitting
const LazyMap = lazy(() => import('./components/map/LeafletMap'));
const LazyGlobe = lazy(() => import('./components/map/ThreeGlobeMap'));
```

## Library Update Strategy

### Semantic Versioning
- **Patch updates**: Bug fixes and security updates
- **Minor updates**: New features, backward compatible
- **Major updates**: Breaking changes, requires testing

### Update Process
1. Review changelog and breaking changes
2. Update development dependencies first
3. Test in development environment
4. Update production dependencies
5. Run full test suite
6. Deploy with monitoring
