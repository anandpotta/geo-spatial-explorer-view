
import L from 'leaflet';
import 'leaflet-draw';

// This function ensures that L.Control.Draw is available
export const initializeLeafletDraw = () => {
  if (typeof window !== 'undefined') {
    // Check if L.Control.Draw is already available
    if (L && !L.Control.Draw) {
      console.warn("L.Control.Draw not found, attempting to initialize");
      // Try to ensure leaflet-draw is loaded
      // We need to re-require leaflet-draw here to ensure it's loaded
      require('leaflet-draw');
    }
    
    // Check if initialization worked
    if (L && L.Control.Draw) {
      console.log("L.Control.Draw is now available");
      return true;
    } else {
      console.error("Failed to initialize L.Control.Draw");
      return false;
    }
  }
  return false;
};

// Call this function to fix missing Draw icons
export const setupLeafletDrawIcons = () => {
  // Add styles to fix the missing icons issue
  if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* Fix for missing Draw icons */
      .leaflet-draw-toolbar a {
        background-image: url('https://unpkg.com/leaflet-draw@1.0.4/dist/images/spritesheet.png');
        background-repeat: no-repeat;
      }
      .leaflet-retina .leaflet-draw-toolbar a {
        background-image: url('https://unpkg.com/leaflet-draw@1.0.4/dist/images/spritesheet-2x.png');
        background-size: 270px 30px;
      }
    `;
    document.head.appendChild(styleEl);
  }
};

// Initialize both the plugin and icons
export const initializeLeafletDrawComplete = () => {
  const isInitialized = initializeLeafletDraw();
  setupLeafletDrawIcons();
  return isInitialized;
};
