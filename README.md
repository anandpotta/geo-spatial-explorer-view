
# GeoSpatial Explorer

A full-stack application for exploring geographic data with 3D and 2D visualization capabilities.

## Features

- 3D Earth view using CesiumJS
- 2D map view using Leaflet
- Location search with OpenStreetMap
- Drawing and annotation tools
- Offline support with local storage
- Backend synchronization with Node.js

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - CesiumJS
  - Leaflet
  - TailwindCSS
  - ShadcnUI

- Backend:
  - Node.js
  - Express
  - File-based JSON storage

## Setup Instructions

### Frontend

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

### Backend

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm run dev
```

## Usage

1. The application starts with a 3D Earth view.
2. Use the search bar to find locations.
3. When a location is selected, the view will fly to that location in 3D.
4. After arriving, the view transitions to a 2D map for detailed editing.
5. Use the drawing tools to mark buildings, areas, or points of interest.
6. All data is saved locally and synchronized with the backend when online.

## Offline Support

The application functions fully offline with:
- Local storage for saving markers and drawings
- Automatic synchronization when reconnected to the internet
- Status indicator showing online/offline state

## Project Structure

- `/src` - Frontend React application
- `/server` - Backend Node.js server
- `/public` - Static assets

## Development

- The frontend and backend can be developed independently.
- Changes to the frontend will be immediately visible via hot reloading.
- Backend changes require server restart (automatic with nodemon).

## Deployment

1. Build the frontend:
```bash
npm run build
```

2. Copy the contents of the `dist` directory to the `server` directory.

3. Start the production server:
```bash
cd server
NODE_ENV=production npm start
```
