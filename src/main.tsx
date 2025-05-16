
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
  }
  .map-tiles, .map-tiles-refreshed {
    opacity: 1 !important;
    z-index: 200 !important;
  }
  .leaflet-tile {
    visibility: visible !important;
    opacity: 1 !important;
  }
  .leaflet-container {
    background: #f0f0f0 !important;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
