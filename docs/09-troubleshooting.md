
# Troubleshooting Guide

## Common Issues and Solutions

### Map Loading Issues

#### Issue: Map Container Not Displaying
**Symptoms**: Blank area where map should appear

**Diagnostic Steps**:
```typescript
// Check container dimensions
const diagnoseMapContainer = (containerRef: RefObject<HTMLDivElement>) => {
  if (containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect();
    console.log('Container dimensions:', {
      width: rect.width,
      height: rect.height,
      display: getComputedStyle(containerRef.current).display,
      position: getComputedStyle(containerRef.current).position
    });
  }
};
```

**Solutions**:
1. Ensure container has explicit height/width
```css
.map-container {
  width: 100%;
  height: 400px; /* Explicit height required */
}
```

2. Check parent container constraints
```typescript
// Ensure parent containers don't have height: 0
const checkParentConstraints = (element: HTMLElement) => {
  let parent = element.parentElement;
  while (parent) {
    const styles = getComputedStyle(parent);
    if (styles.height === '0px') {
      console.warn('Parent container has zero height:', parent);
    }
    parent = parent.parentElement;
  }
};
```

#### Issue: Map Tiles Not Loading
**Symptoms**: Gray grid pattern, no map imagery

**Diagnostic Steps**:
```typescript
// Test tile server connectivity
const testTileServer = async () => {
  try {
    const response = await fetch('https://tile.openstreetmap.org/0/0/0.png');
    if (!response.ok) {
      console.error('Tile server response:', response.status);
    }
  } catch (error) {
    console.error('Tile server unreachable:', error);
  }
};
```

**Solutions**:
1. Check network connectivity
2. Verify tile URL configuration
3. Check for CORS issues
4. Try alternative tile providers

#### Issue: Map Performance Problems
**Symptoms**: Slow panning, laggy interactions

**Solutions**:
```typescript
// Optimize map rendering
const optimizeMapPerformance = (map: L.Map) => {
  // Enable hardware acceleration
  map.getRenderer(L.Path).options.preferCanvas = true;
  
  // Reduce marker clustering threshold
  const markerClusterOptions = {
    chunkedLoading: true,
    chunkProgress: (processed, total) => {
      console.log(`Loading markers: ${processed}/${total}`);
    }
  };
  
  // Debounce map events
  const debouncedMoveEnd = debounce(() => {
    // Handle move end
  }, 100);
  
  map.on('moveend', debouncedMoveEnd);
};
```

### Drawing Tool Issues

#### Issue: Drawing Tools Not Responding
**Symptoms**: Cannot create shapes, tools inactive

**Diagnostic Steps**:
```typescript
// Check Leaflet Draw initialization
const diagnoseDraw = (map: L.Map) => {
  console.log('Leaflet Draw version:', L.Draw.version);
  console.log('Feature group attached:', map.hasLayer(featureGroup));
  console.log('Draw control added:', !!map._controlLayers);
};
```

**Solutions**:
1. Ensure Leaflet Draw CSS is loaded
```typescript
// Check CSS loading
const checkDrawCSS = () => {
  const links = Array.from(document.querySelectorAll('link[href*="leaflet.draw"]'));
  if (links.length === 0) {
    console.error('Leaflet Draw CSS not loaded');
  }
};
```

2. Verify feature group initialization
```typescript
// Proper feature group setup
const setupFeatureGroup = (map: L.Map) => {
  const featureGroup = new L.FeatureGroup();
  map.addLayer(featureGroup);
  
  // Verify layer was added
  if (!map.hasLayer(featureGroup)) {
    console.error('Failed to add feature group to map');
  }
  
  return featureGroup;
};
```

#### Issue: SVG Paths Not Rendering
**Symptoms**: Drawings disappear after creation

**Solutions**:
```typescript
// Ensure SVG renderer is properly configured
const configureSVGRenderer = () => {
  // Force SVG renderer for consistent rendering
  L.Browser.canvas = false;
  
  // Create custom SVG renderer with proper options
  const svgRenderer = L.svg({
    padding: 0.1,
    tolerance: 10
  });
  
  return svgRenderer;
};

// Check SVG element creation
const diagnoseSVGPaths = () => {
  const svgElements = document.querySelectorAll('.leaflet-overlay-pane svg');
  const pathElements = document.querySelectorAll('.leaflet-overlay-pane path');
  
  console.log('SVG elements found:', svgElements.length);
  console.log('Path elements found:', pathElements.length);
  
  pathElements.forEach((path, index) => {
    console.log(`Path ${index}:`, {
      d: path.getAttribute('d'),
      stroke: path.getAttribute('stroke'),
      fill: path.getAttribute('fill')
    });
  });
};
```

### Three.js Globe Issues

#### Issue: Globe Not Rendering
**Symptoms**: Black screen, WebGL errors

**Diagnostic Steps**:
```typescript
// Check WebGL support
const checkWebGLSupport = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    console.error('WebGL not supported');
    return false;
  }
  
  console.log('WebGL vendor:', gl.getParameter(gl.VENDOR));
  console.log('WebGL renderer:', gl.getParameter(gl.RENDERER));
  return true;
};

// Check Three.js scene setup
const diagnoseThreeJS = (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
  console.log('Scene children:', scene.children.length);
  console.log('Camera position:', camera.position);
  console.log('Renderer size:', renderer.getSize(new THREE.Vector2()));
  console.log('Renderer pixel ratio:', renderer.getPixelRatio());
};
```

**Solutions**:
1. Check WebGL capabilities
2. Reduce texture quality for low-end devices
3. Implement fallback for unsupported browsers

#### Issue: Poor Globe Performance
**Symptoms**: Low frame rate, stuttering

**Solutions**:
```typescript
// Performance optimization
const optimizeGlobePerformance = (renderer: THREE.WebGLRenderer) => {
  // Limit pixel ratio for performance
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // Enable renderer optimizations
  renderer.powerPreference = "high-performance";
  renderer.antialias = false; // Disable on mobile
  
  // Optimize textures
  const optimizeTexture = (texture: THREE.Texture) => {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
  };
};

// Memory management
const manageThreeJSMemory = () => {
  // Dispose unused resources
  const disposeObject = (object: THREE.Object3D) => {
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
  
  // Monitor memory usage
  const info = renderer.info;
  console.log('Three.js memory:', {
    geometries: info.memory.geometries,
    textures: info.memory.textures,
    programs: info.programs?.length || 0
  });
};
```

### Data Persistence Issues

#### Issue: Local Storage Not Working
**Symptoms**: Data not persisting between sessions

**Diagnostic Steps**:
```typescript
// Test local storage functionality
const testLocalStorage = () => {
  try {
    const testKey = 'test-storage';
    const testValue = 'test-value';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== testValue) {
      console.error('Local storage not working correctly');
      return false;
    }
    
    // Check storage quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        console.log('Storage quota:', {
          quota: estimate.quota,
          usage: estimate.usage,
          usagePercentage: (estimate.usage! / estimate.quota!) * 100
        });
      });
    }
    
    return true;
  } catch (error) {
    console.error('Local storage error:', error);
    return false;
  }
};
```

**Solutions**:
1. Check private browsing mode
2. Verify storage quota limits
3. Implement fallback storage mechanism

#### Issue: Data Corruption
**Symptoms**: Invalid data loaded from storage

**Solutions**:
```typescript
// Data validation and recovery
const validateStorageData = <T>(key: string, validator: (data: any) => data is T): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(`Invalid data format for ${key}, resetting`);
      localStorage.removeItem(key);
      return [];
    }
    
    // Filter out invalid items
    const valid = parsed.filter(validator);
    if (valid.length !== parsed.length) {
      console.warn(`Removed ${parsed.length - valid.length} invalid items from ${key}`);
      localStorage.setItem(key, JSON.stringify(valid));
    }
    
    return valid;
  } catch (error) {
    console.error(`Error validating ${key}:`, error);
    localStorage.removeItem(key);
    return [];
  }
};

// Type guards for validation
const isValidLocationMarker = (data: any): data is LocationMarker => {
  return data &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    Array.isArray(data.position) &&
    data.position.length === 2 &&
    typeof data.position[0] === 'number' &&
    typeof data.position[1] === 'number';
};
```

### Import/Export Issues

#### Issue: TypeScript Import Errors
**Symptoms**: Module not found, type errors

**Solutions**:
```typescript
// Check tsconfig.json path mapping
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/utils/*": ["src/utils/*"]
    }
  }
}

// Verify Vite alias configuration
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

#### Issue: Circular Dependency Warnings
**Symptoms**: Build warnings about circular imports

**Solutions**:
1. Analyze dependency graph
```bash
# Use madge to detect circular dependencies
npx madge --circular --extensions ts,tsx src/
```

2. Refactor circular dependencies
```typescript
// Before (circular dependency)
// utils/a.ts
import { functionB } from './b';

// utils/b.ts  
import { functionA } from './a';

// After (extract shared logic)
// utils/shared.ts
export const sharedFunction = () => { /* */ };

// utils/a.ts
import { sharedFunction } from './shared';

// utils/b.ts
import { sharedFunction } from './shared';
```

### Performance Issues

#### Issue: Memory Leaks
**Symptoms**: Increasing memory usage over time

**Diagnostic Tools**:
```typescript
// Memory usage monitoring
const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
  
  // Check for DOM memory leaks
  console.log('DOM nodes:', document.querySelectorAll('*').length);
};

// Event listener leak detection
const trackEventListeners = () => {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
  const listeners = new Map();
  
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    const key = `${this.constructor.name}-${type}`;
    listeners.set(key, (listeners.get(key) || 0) + 1);
    originalAddEventListener.call(this, type, listener, options);
  };
  
  EventTarget.prototype.removeEventListener = function(type, listener, options) {
    const key = `${this.constructor.name}-${type}`;
    listeners.set(key, Math.max(0, (listeners.get(key) || 0) - 1));
    originalRemoveEventListener.call(this, type, listener, options);
  };
  
  // Log listener counts periodically
  setInterval(() => {
    console.log('Active listeners:', Object.fromEntries(listeners));
  }, 5000);
};
```

**Solutions**:
1. Proper cleanup in useEffect
```typescript
useEffect(() => {
  const handler = () => { /* event logic */ };
  window.addEventListener('resize', handler);
  
  return () => {
    window.removeEventListener('resize', handler);
  };
}, []);
```

2. Dispose Three.js resources
```typescript
useEffect(() => {
  return () => {
    // Clean up Three.js objects
    if (scene) {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    }
  };
}, []);
```

## Browser Compatibility Issues

### Safari-Specific Issues

#### Issue: CSS Grid Layout Problems
**Solutions**:
```css
/* Safari grid fallbacks */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  
  /* Safari fallback */
  display: -webkit-grid;
  -webkit-grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

#### Issue: Flexbox Inconsistencies
**Solutions**:
```css
/* Safari flex fixes */
.flex-container {
  display: flex;
  flex-direction: column;
  
  /* Safari fix for min-height */
  min-height: 0;
}

.flex-item {
  flex: 1;
  
  /* Safari flex-shrink fix */
  flex-shrink: 0;
  min-width: 0;
}
```

### Mobile Browser Issues

#### Issue: Touch Event Conflicts
**Solutions**:
```typescript
// Prevent map touch conflicts
const handleTouchEvents = (mapContainer: HTMLElement) => {
  mapContainer.addEventListener('touchstart', (e) => {
    // Prevent page scroll when interacting with map
    if (e.touches.length === 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Disable pull-to-refresh on map
  mapContainer.style.overscrollBehavior = 'none';
};
```

#### Issue: Viewport Scaling Issues
**Solutions**:
```html
<!-- Proper viewport configuration -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

## Development Environment Issues

### Node.js Version Conflicts
```bash
# Use Node Version Manager
nvm install 18
nvm use 18

# Verify version
node --version
npm --version
```

### Package Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For persistent issues, try different registry
npm install --registry https://registry.npmjs.org/
```

### Build Issues
```bash
# TypeScript compilation errors
npx tsc --noEmit

# ESLint errors
npx eslint src/ --fix

# Dependency conflicts
npm ls
npm audit fix
```

## Production Issues

### Server Deployment Problems
```bash
# Check server logs
docker logs container_name

# Health check
curl http://localhost:3001/health

# Process monitoring
pm2 status
pm2 logs
```

### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in certificate.crt -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443
```

## Getting Help

### Community Resources
- GitHub Issues: Report bugs and feature requests
- Stack Overflow: Tag questions with `geospatial-explorer`
- Discord Community: Real-time discussion and support

### Debugging Tools
- React Developer Tools
- Leaflet Debug Plugin
- Three.js Inspector
- Performance tab in Chrome DevTools

### Professional Support
For enterprise customers:
- Priority support tickets
- Custom development consultation
- Performance optimization services
- Training and onboarding sessions
