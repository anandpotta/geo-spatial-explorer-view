
# Development Guide

## Development Environment Setup

### IDE Configuration

#### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### VS Code Settings
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

### Development Workflow

#### Branch Strategy
```bash
main           # Production-ready code
develop        # Integration branch
feature/*      # Feature development
bugfix/*       # Bug fixes
hotfix/*       # Critical production fixes
```

#### Commit Convention
```bash
feat: add location search functionality
fix: resolve map rendering issue
docs: update API documentation
style: format component files
refactor: extract map utilities
test: add marker creation tests
```

## Code Standards and Guidelines

### TypeScript Best Practices

#### Type Definitions
```typescript
// Prefer interfaces for object shapes
interface LocationMarker {
  id: string;
  name: string;
  position: [number, number];
}

// Use type aliases for unions and primitives
type MarkerType = 'pin' | 'area' | 'building';
type MapTheme = 'light' | 'dark';

// Prefer const assertions for immutable data
const ZOOM_LEVELS = [1, 5, 10, 15, 18] as const;
type ZoomLevel = typeof ZOOM_LEVELS[number];
```

#### Generic Types
```typescript
// Reusable generic interfaces
interface APIResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

// Constrained generics
interface MapComponent<T extends GeoLocation> {
  locations: T[];
  onLocationSelect: (location: T) => void;
}
```

### Component Development Patterns

#### Component Structure
```typescript
// 1. Imports (grouped and sorted)
import React, { useState, useEffect, useCallback } from 'react';
import { LocationMarker } from '@/utils/marker-utils';
import { Button } from '@/components/ui/button';

// 2. Type definitions
interface ComponentProps {
  // Props interface
}

// 3. Component implementation
const Component: React.FC<ComponentProps> = ({ 
  prop1, 
  prop2 
}) => {
  // 4. State and hooks
  const [state, setState] = useState();
  
  // 5. Event handlers
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // 6. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 8. Export
export default Component;
```

#### Custom Hook Patterns
```typescript
// Hook naming: use[Domain][Action]
export function useMapState(initialLocation?: Location) {
  const [state, setState] = useState();
  
  // Return object with state and actions
  return {
    // State
    position,
    markers,
    isLoading,
    
    // Actions
    addMarker,
    removeMarker,
    clearAll,
    
    // Computed values
    markerCount: markers.length,
    bounds: calculateBounds(markers)
  };
}
```

### File Organization Standards

#### Folder Structure
```
src/
├── components/
│   ├── [feature]/           # Feature-based grouping
│   │   ├── index.ts        # Re-export components
│   │   ├── Component.tsx   # Main component
│   │   ├── Component.test.tsx
│   │   └── hooks/          # Feature-specific hooks
│   └── ui/                 # Reusable UI components
├── hooks/
│   ├── [domain]/           # Domain-specific hooks
│   └── index.ts            # Common hooks
├── utils/
│   ├── [domain]/           # Domain-specific utilities
│   │   ├── index.ts        # Re-exports
│   │   ├── types.ts        # Type definitions
│   │   └── operations.ts   # Business logic
└── services/               # External service integrations
```

#### Import/Export Patterns
```typescript
// Named exports preferred
export const Component = () => { /* */ };
export const utility = () => { /* */ };

// Index files for clean imports
export { Component } from './Component';
export { utility } from './utility';

// Import organization
// 1. React and React ecosystem
import React from 'react';
import { useState } from 'react';

// 2. Third-party libraries
import L from 'leaflet';
import { toast } from 'sonner';

// 3. Internal imports (absolute paths)
import { LocationMarker } from '@/utils/marker-utils';
import { Button } from '@/components/ui/button';

// 4. Relative imports
import './Component.css';
```

## Testing Strategy

### Unit Testing
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationSearch } from './LocationSearch';

describe('LocationSearch', () => {
  it('should call onLocationSelect when location is chosen', () => {
    const mockOnLocationSelect = jest.fn();
    
    render(
      <LocationSearch onLocationSelect={mockOnLocationSelect} />
    );
    
    const input = screen.getByPlaceholderText('Search location...');
    fireEvent.change(input, { target: { value: 'New York' } });
    
    // Assert behavior
    expect(mockOnLocationSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'New York',
        x: expect.any(Number),
        y: expect.any(Number)
      })
    );
  });
});
```

### Integration Testing
```typescript
// Hook testing
import { renderHook, act } from '@testing-library/react';
import { useMapState } from './useMapState';

describe('useMapState', () => {
  it('should add marker correctly', () => {
    const { result } = renderHook(() => useMapState());
    
    act(() => {
      result.current.addMarker({
        id: '1',
        name: 'Test Location',
        position: [40.7128, -74.0060]
      });
    });
    
    expect(result.current.markers).toHaveLength(1);
    expect(result.current.markers[0].name).toBe('Test Location');
  });
});
```

## Performance Optimization

### React Optimization Patterns

#### Memoization
```typescript
// Component memoization
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Expensive rendering */}</div>;
});

// Hook memoization
const useExpensiveCalculation = (data: any[]) => {
  return useMemo(() => {
    return data.reduce((acc, item) => {
      // Expensive calculation
      return acc + item.value;
    }, 0);
  }, [data]);
};

// Callback memoization
const Component = ({ onItemClick }) => {
  const handleClick = useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);
  
  return <div onClick={() => handleClick('item-1')} />;
};
```

#### Lazy Loading
```typescript
// Route-based splitting
const LazyMapView = lazy(() => import('./components/map/MapView'));
const LazyGlobeView = lazy(() => import('./components/globe/GlobeView'));

// Conditional loading
const ConditionalComponent = ({ showAdvanced }) => {
  const AdvancedFeatures = useMemo(() => {
    return showAdvanced 
      ? lazy(() => import('./AdvancedFeatures'))
      : null;
  }, [showAdvanced]);
  
  return (
    <div>
      {AdvancedFeatures && (
        <Suspense fallback={<div>Loading...</div>}>
          <AdvancedFeatures />
        </Suspense>
      )}
    </div>
  );
};
```

### Map Performance

#### Leaflet Optimizations
```typescript
// Efficient marker clustering
const useMarkerClustering = (markers: LocationMarker[]) => {
  return useMemo(() => {
    if (markers.length < 100) return markers;
    
    // Implement clustering algorithm
    return clusterMarkers(markers);
  }, [markers]);
};

// Debounced map interactions
const useMapInteraction = () => {
  const debouncedHandler = useMemo(
    () => debounce((event: L.LeafletEvent) => {
      // Handle map interaction
    }, 100),
    []
  );
  
  return debouncedHandler;
};
```

#### Three.js Optimizations
```typescript
// Efficient geometry disposal
export const disposeThreeResources = (object: THREE.Object3D) => {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
};

// Texture optimization
const useOptimizedTextures = () => {
  return useMemo(() => {
    const loader = new THREE.TextureLoader();
    const texture = loader.load('/earth-texture.jpg');
    
    // Optimize texture settings
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    
    return texture;
  }, []);
};
```

## Debugging and Troubleshooting

### Debug Configuration

#### Console Logging Strategy
```typescript
// Structured logging
const createLogger = (module: string) => ({
  info: (message: string, data?: any) => {
    console.log(`[${module}] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[${module}] ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`[${module}] ${message}`, error);
  }
});

// Usage
const logger = createLogger('MapComponent');
logger.info('Map initialized', { center, zoom });
```

#### React DevTools Usage
```typescript
// Component debugging
const DebugInfo = ({ data }) => {
  // Only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Component render:', { data, timestamp: Date.now() });
  }
  
  return null;
};

// Performance profiling
const ProfiledComponent = React.memo(({ data }) => {
  return (
    <React.Profiler
      id="MapComponent"
      onRender={(id, phase, actualDuration) => {
        console.log(`${id} ${phase} took ${actualDuration}ms`);
      }}
    >
      <MapComponent data={data} />
    </React.Profiler>
  );
});
```

### Common Issues and Solutions

#### Map Loading Issues
```typescript
// Issue: Map tiles not loading
// Solution: Check network connectivity and tile URL
const diagnoseMapIssues = () => {
  // Check tile server availability
  fetch('https://tile.openstreetmap.org/0/0/0.png')
    .then(response => {
      if (!response.ok) {
        console.error('Tile server unavailable');
      }
    })
    .catch(error => {
      console.error('Network connectivity issue:', error);
    });
};

// Issue: Map container size issues
// Solution: Ensure container has explicit dimensions
const ensureMapContainerSize = (containerRef: RefObject<HTMLDivElement>) => {
  if (containerRef.current) {
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width === 0 || height === 0) {
      console.warn('Map container has zero dimensions');
    }
  }
};
```

## Contributing Guidelines

### Pull Request Process

1. **Create Feature Branch**
```bash
git checkout -b feature/location-search-enhancement
```

2. **Make Changes Following Standards**
- Follow TypeScript and React best practices
- Add appropriate tests
- Update documentation

3. **Test Changes**
```bash
npm run test
npm run type-check
npm run lint
```

4. **Submit Pull Request**
- Provide clear description of changes
- Include screenshots for UI changes
- Reference related issues

### Code Review Guidelines

#### Review Checklist
- [ ] Code follows established patterns
- [ ] TypeScript types are properly defined
- [ ] Components are properly memoized
- [ ] Error handling is implemented
- [ ] Tests cover new functionality
- [ ] Documentation is updated

#### Review Comments
```typescript
// Good: Specific, actionable feedback
// Consider using useMemo here to prevent unnecessary recalculations
const expensiveValue = useMemo(() => 
  calculateExpensiveValue(data), [data]
);

// Good: Suggest alternative approach
// This could be simplified using the existing utility function
import { formatCoordinates } from '@/utils/geo-utils';
```

### Release Process

#### Version Management
```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features)
npm version minor

# Major release (breaking changes)
npm version major
```

#### Deployment Checklist
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Library build successful
- [ ] Documentation updated
- [ ] Version bumped appropriately
- [ ] Changelog updated
