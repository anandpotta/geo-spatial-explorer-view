
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// Import leaflet CSS at the application level
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
