
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
  }
  .map-tiles {
    opacity: 1 !important;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
