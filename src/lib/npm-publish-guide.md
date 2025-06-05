
# NPM Publishing Guide for GeoSpatial Explorer

## Prerequisites

1. **NPM Account**: Create account at [npmjs.com](https://www.npmjs.com)
2. **Organization**: Create organization (optional): `@your-org`
3. **NPM CLI**: Install and login
   ```bash
   npm login
   ```

## Step-by-Step Publishing Process

### 1. Prepare the Package

```bash
cd src/lib
node build-scripts/prepare-package.js
```

### 2. Update Package Information

Edit `package-build.json`:
```json
{
  "name": "@your-org/geospatial-explorer",
  "version": "1.0.0",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/geospatial-explorer.git"
  }
}
```

### 3. Build the Package

```bash
npm run build
```

This creates:
- `dist/cjs/` - CommonJS modules
- `dist/esm/` - ES modules  
- `dist/types/` - TypeScript declarations

### 4. Test Locally

```bash
npm pack
```

This creates a `.tgz` file you can test:
```bash
npm install /path/to/your-org-geospatial-explorer-1.0.0.tgz
```

### 5. Publish to NPM

```bash
# For public packages
npm publish --access public

# For scoped packages
npm publish
```

## Version Management

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major
```

## Usage After Publishing

### React Projects
```bash
npm install @your-org/geospatial-explorer
```

```tsx
import { GeoSpatialExplorer } from '@your-org/geospatial-explorer/react';
```

### Angular Projects
```bash
npm install @your-org/geospatial-explorer
```

```typescript
import { GeospatialModule } from '@your-org/geospatial-explorer/angular';
```

### React Native Projects
```bash
npm install @your-org/geospatial-explorer
```

```tsx
import { GeoSpatialExplorerNative } from '@your-org/geospatial-explorer/react-native';
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Best Practices

1. **Semantic Versioning**: Follow semver for version numbers
2. **Changelog**: Maintain CHANGELOG.md
3. **Documentation**: Keep README.md updated
4. **Testing**: Run tests before publishing
5. **Bundle Size**: Monitor package size with `bundlephobia.com`
