
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import leaflet CSS at the application level
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Add global styles to ensure map tiles display properly
const style = document.createElement('style');
style.textContent = `
  .leaflet-tile-container {
    opacity: 1 !important;
    visibility: visible !important;
    z-index: 200 !important;
    pointer-events: auto !important;
  }
  .map-tiles, .map-tiles-refreshed {
    opacity: 1 !important;
    z-index: 200 !important;
    visibility: visible !important;
  }
  .leaflet-tile {
    visibility: visible !important;
    opacity: 1 !important;
  }
  .leaflet-container {
    background: #f0f0f0 !important;
  }
  .leaflet-pane {
    z-index: 400 !important; 
  }
  .leaflet-tile-pane {
    z-index: 200 !important;
  }
  .leaflet-overlay-pane {
    z-index: 400 !important;
  }
  .leaflet-marker-pane {
    z-index: 600 !important;
  }
  .leaflet-tooltip-pane {
    z-index: 650 !important;
  }
  .leaflet-popup-pane {
    z-index: 700 !important;
  }
  .leaflet-map-pane {
    z-index: 100 !important;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
