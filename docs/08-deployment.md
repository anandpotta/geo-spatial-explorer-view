
# Deployment Guide

## Build Process

### Development Build
```bash
# Start development server
npm run dev

# Development server features:
# - Hot module replacement
# - Source maps
# - Detailed error messages
# - Development-only debugging tools
```

### Production Build
```bash
# Build for production
npm run build

# Production build optimizations:
# - Code minification and compression
# - Tree shaking for unused code elimination
# - Asset optimization and chunking
# - Source map generation for debugging
```

### Build Configuration

#### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          maps: ['leaflet', 'react-leaflet'],
          three: ['three']
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
});
```

## Library Build and Publishing

### Cross-Platform Library Build

The library supports multiple output formats for different platforms:

```bash
cd src/lib
npm run build

# Generates:
# dist/cjs/    - CommonJS modules (Node.js, older bundlers)
# dist/esm/    - ES modules (modern bundlers, tree-shaking)
# dist/types/  - TypeScript definition files
```

#### Build Script Analysis
```javascript
// src/lib/build.js
const buildProcess = {
  // 1. Clean previous build
  cleanDist: () => fs.rmSync('./dist', { recursive: true }),
  
  // 2. Create output directories
  createDirs: () => {
    fs.mkdirSync('./dist/cjs', { recursive: true });
    fs.mkdirSync('./dist/esm', { recursive: true });
    fs.mkdirSync('./dist/types', { recursive: true });
  },
  
  // 3. Build CommonJS (Node.js compatibility)
  buildCJS: () => execSync('npx tsc --module commonjs --outDir ./dist/cjs'),
  
  // 4. Build ES Modules (tree-shaking support)
  buildESM: () => execSync('npx tsc --module es2015 --outDir ./dist/esm'),
  
  // 5. Generate TypeScript definitions
  buildTypes: () => execSync('npx tsc --declaration --emitDeclarationOnly')
};
```

### Publishing Process

#### NPM Publishing
```bash
# 1. Update version
cd src/lib
npm version patch  # or minor/major

# 2. Build all formats
npm run build

# 3. Publish to NPM
npm publish

# Publishing checklist:
# ✓ Version incremented
# ✓ All builds successful
# ✓ Package.json exports configured
# ✓ README and documentation updated
```

#### Package.json Configuration
```json
{
  "name": "geospatial-explorer-lib",
  "main": "dist/cjs/lib/index.js",      // CommonJS entry
  "module": "dist/esm/lib/index.js",    // ES Module entry
  "types": "dist/types/lib/index.d.ts", // TypeScript definitions
  "exports": {
    ".": {
      "import": "./dist/esm/lib/index.js",
      "require": "./dist/cjs/lib/index.js",
      "types": "./dist/types/lib/index.d.ts"
    },
    "./react": {
      "import": "./dist/esm/lib/react/index.js",
      "require": "./dist/cjs/lib/react/index.js",
      "types": "./dist/types/lib/react/index.d.ts"
    }
  },
  "files": ["dist", "LICENSE", "README.md"],
  "sideEffects": false  // Enables better tree-shaking
}
```

## Frontend Deployment

### Static Site Deployment

#### Netlify Deployment
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
VITE_API_BASE_URL=https://your-api.com
```

#### Vercel Deployment
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "buildCommand": "npm run build",
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

#### GitHub Pages Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### CDN and Asset Optimization

#### Asset Optimization
```typescript
// Optimize images and assets
const optimizeAssets = {
  images: {
    // Use WebP format for better compression
    formats: ['webp', 'png', 'jpg'],
    
    // Responsive images
    sizes: [320, 640, 1024, 1920],
    
    // Lazy loading
    loading: 'lazy'
  },
  
  fonts: {
    // Preload critical fonts
    preload: ['Inter-Regular.woff2'],
    
    // Font display strategy
    display: 'swap'
  }
};
```

#### CDN Configuration
```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/images/earth-texture.jpg" as="image">

<!-- DNS prefetch for external resources -->
<link rel="dns-prefetch" href="//tile.openstreetmap.org">
<link rel="dns-prefetch" href="//api.github.com">
```

## Backend Deployment

### Express Server Deployment

#### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server code
COPY server/ ./

EXPOSE 3001

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/usr/share/nginx/html
    depends_on:
      - api
```

#### Production Server Configuration
```javascript
// server/index.js production configuration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"]
    }
  }
}));

// Performance middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Environment Configuration

### Environment Variables

#### Development Environment
```env
# .env.local
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3001
VITE_ENABLE_DEBUG=true
VITE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

#### Production Environment
```env
# .env.production
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.yourapp.com
VITE_ENABLE_DEBUG=false
VITE_SENTRY_DSN=your-sentry-dsn
```

#### Environment Validation
```typescript
// src/config/env.ts
const requiredEnvVars = [
  'VITE_API_BASE_URL'
] as const;

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(
    key => !import.meta.env[key]
  );
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true'
};

// Validate on module load
validateEnvironment();
```

## Performance Monitoring

### Build Analysis

#### Bundle Size Analysis
```bash
# Analyze bundle size
npm run build:analyze

# Using webpack-bundle-analyzer alternative for Vite
npx vite-bundle-analyzer dist
```

#### Performance Metrics
```typescript
// Performance monitoring
const trackPerformance = () => {
  // Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
  
  // Custom metrics
  performance.mark('app-start');
  
  window.addEventListener('load', () => {
    performance.mark('app-loaded');
    performance.measure('app-load-time', 'app-start', 'app-loaded');
    
    const measure = performance.getEntriesByName('app-load-time')[0];
    console.log(`App loaded in ${measure.duration}ms`);
  });
};
```

### Error Monitoring

#### Sentry Integration
```typescript
// Error tracking setup
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
  ],
  tracesSampleRate: 1.0,
});
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Build process completes without errors
- [ ] Environment variables configured
- [ ] Security headers configured
- [ ] Performance optimizations applied

### Post-Deployment
- [ ] Health check endpoints responding
- [ ] All critical features working
- [ ] Performance metrics within acceptable ranges
- [ ] Error monitoring active
- [ ] SSL certificates valid
- [ ] CDN cache invalidated if needed

### Rollback Plan
```bash
# Quick rollback procedure
# 1. Identify last known good version
git log --oneline -10

# 2. Create rollback branch
git checkout -b rollback-to-previous main~1

# 3. Deploy rollback version
npm run build
npm run deploy

# 4. Monitor for stability
# 5. Investigate and fix issues in separate branch
```
