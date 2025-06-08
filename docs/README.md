
# GeoSpatial Explorer - Complete Documentation

Welcome to the GeoSpatial Explorer project documentation. This is a comprehensive cross-platform geospatial application that supports interactive maps, 3D globes, drawing tools, and location management across React, React Native, and Angular platforms.

## 📚 Documentation Index

- [Project Overview](./01-project-overview.md) - High-level architecture and goals
- [Getting Started](./02-getting-started.md) - Setup and installation guide
- [Core Architecture](./03-core-architecture.md) - System design and patterns
- [Component Library](./04-component-library.md) - Detailed component documentation
- [Libraries & Dependencies](./05-libraries-dependencies.md) - Third-party integrations
- [API Reference](./06-api-reference.md) - Complete API documentation
- [Development Guide](./07-development-guide.md) - Contributing and extending
- [Deployment](./08-deployment.md) - Build and deployment instructions
- [Troubleshooting](./09-troubleshooting.md) - Common issues and solutions

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build library
cd src/lib && npm run build
```

## 🏗️ Project Structure

```
geospatial-explorer/
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── services/           # API services
│   ├── contexts/           # React contexts
│   └── lib/                # Cross-platform library
├── docs/                   # Documentation
├── server/                 # Backend server
└── public/                 # Static assets
```

## 🎯 Key Features

- **Interactive Maps**: Leaflet-based 2D mapping with drawing tools
- **3D Globe**: Three.js powered 3D earth visualization
- **Cross-Platform**: React, React Native, and Angular support
- **Location Management**: Search, save, and organize locations
- **Drawing Tools**: Polygons, circles, rectangles with floor plan overlay
- **Export Capabilities**: GeoJSON export with enhanced metadata
- **Real-time Sync**: Local storage with backend synchronization

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Mapping**: Leaflet, React-Leaflet, Leaflet-Draw
- **3D Graphics**: Three.js with custom globe implementation
- **UI Components**: Shadcn/ui, Radix UI
- **State Management**: React hooks, Context API
- **Build Tools**: Vite, ESBuild
- **Testing**: Built-in TypeScript validation

For detailed information, please refer to the specific documentation files listed above.
