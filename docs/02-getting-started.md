
# Getting Started

## Prerequisites

### System Requirements
- Node.js 18+ 
- npm 8+ or yarn 1.22+
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- Git for version control

### Development Environment
- VS Code (recommended) with extensions:
  - TypeScript and JavaScript Language Server
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Auto Rename Tag

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd geospatial-explorer
```

### 2. Install Dependencies
```bash
# Install main project dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
# Optional: Add any API keys here
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_API_BASE_URL=http://localhost:3001
```

## Development Server

### Start the Development Environment
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:client    # Frontend only
npm run dev:server    # Backend only
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## Project Structure Overview

```
geospatial-explorer/
├── public/                 # Static assets
│   ├── lovable-uploads/   # User uploaded images
│   └── robots.txt         # SEO configuration
├── src/
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── explorer/     # Main explorer interface
│   │   ├── map/          # Map-related components
│   │   └── ui/           # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   │   ├── three/        # Three.js specific hooks
│   │   └── ...           # Other hooks
│   ├── utils/            # Utility functions
│   │   ├── markers/      # Marker utilities
│   │   ├── drawings/     # Drawing utilities
│   │   └── ...           # Other utilities
│   ├── services/         # API and external services
│   ├── contexts/         # React contexts
│   ├── lib/              # Cross-platform library
│   │   ├── geospatial-core/  # Core platform-agnostic code
│   │   ├── react/        # React-specific exports
│   │   ├── react-native/ # React Native exports
│   │   └── angular/      # Angular exports
│   └── App.tsx           # Main application component
├── server/               # Backend server
├── docs/                 # Documentation
└── package.json          # Project dependencies
```

## First Steps

### 1. Understand the Main Entry Points
- **`src/App.tsx`**: Main application component
- **`src/components/GeoSpatialExplorer.tsx`**: Primary explorer interface
- **`src/lib/index.ts`**: Library entry point for external usage

### 2. Key Configuration Files
- **`vite.config.ts`**: Build configuration
- **`tailwind.config.ts`**: Styling configuration
- **`tsconfig.json`**: TypeScript configuration
- **`src/lib/package.json`**: Library package configuration

### 3. Development Workflow
1. Make changes to components in `src/components/`
2. Test changes in the development server
3. Add new utilities to `src/utils/`
4. Create custom hooks in `src/hooks/`
5. Update documentation as needed

## Building the Library

### Build Commands
```bash
# Build the cross-platform library
cd src/lib
npm run build

# This creates:
# - dist/cjs/     CommonJS modules
# - dist/esm/     ES modules
# - dist/types/   TypeScript definitions
```

### Publishing the Library
```bash
cd src/lib
npm version patch    # Increment version
npm run build       # Build all formats
npm publish         # Publish to npm
```

## Testing Your Setup

1. Start the development server: `npm run dev`
2. Open http://localhost:5173 in your browser
3. Verify the map loads correctly
4. Try searching for a location
5. Test the drawing tools
6. Switch between 2D and 3D views

## Common Issues

### Map Not Loading
- Check browser console for errors
- Ensure all dependencies are installed
- Verify internet connection for tile loading

### TypeScript Errors
- Run `npm run type-check` to see all errors
- Ensure all dependencies are properly typed
- Check that all imports resolve correctly

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `npm run build -- --force`
- Check for conflicting dependency versions
