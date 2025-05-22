
import L from 'leaflet';
import 'leaflet-draw';

// This function ensures that L.Control.Draw is available
export const initializeLeafletDraw = () => {
  if (typeof window !== 'undefined') {
    // Check if L.Control.Draw is already available
    if (L && !L.Control.Draw) {
      console.warn("L.Control.Draw not found, attempting to initialize");
      
      // Define L.Control.Draw if it doesn't exist
      if (L.Control && !L.Control.Draw) {
        try {
          // Import dynamically to ensure it's loaded
          import('leaflet-draw').then(() => {
            console.log("Leaflet Draw imported successfully");
          }).catch(err => {
            console.error("Failed to dynamically import leaflet-draw:", err);
          });
        } catch (err) {
          console.error("Error importing leaflet-draw:", err);
        }
      }
    }
    
    // Check if initialization worked
    if (L && L.Control && L.Control.Draw) {
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
    // Check if styles are already added
    if (!document.getElementById('leaflet-draw-icons-fix')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'leaflet-draw-icons-fix';
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
        .leaflet-draw-toolbar .leaflet-draw-draw-polyline { background-position: -2px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-draw-polygon { background-position: -31px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-draw-rectangle { background-position: -62px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-draw-circle { background-position: -92px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-draw-marker { background-position: -122px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-edit-edit { background-position: -152px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-edit-remove { background-position: -182px -2px; }
      `;
      document.head.appendChild(styleEl);
    }
  }
};

// Initialize both the plugin and icons
export const initializeLeafletDrawComplete = () => {
  const isInitialized = initializeLeafletDraw();
  setupLeafletDrawIcons();
  
  // Properly type the Draw class to match expected interface
  if (!isInitialized && L && L.Control && !L.Control.Draw) {
    try {
      console.warn("Creating stub for L.Control.Draw");
      
      // Create a class that extends L.Control
      L.Control.Draw = class Draw extends L.Control {
        options: any;
        
        constructor(options: any) {
          super();
          this.options = options || {};
          console.log("Draw control initialized with options:", options);
        }
        
        // Define methods using prototype approach to avoid TypeScript errors
        onAdd(map: L.Map) {
          const container = L.DomUtil.create('div', 'leaflet-draw');
          console.log("Draw control added to map");
          return container;
        }
        
        onRemove() {
          console.log("Draw control removed from map");
        }
        
        setDrawingOptions(options: any) {
          console.log("Setting drawing options:", options);
          this.options = { ...this.options, ...options };
          return this;
        }
      };
      
      // Add initialize method to prototype
      (L.Control.Draw.prototype as any).initialize = function(options: any) {
        L.setOptions(this, options);
        console.log("Draw control initialized");
        return this;
      };
      
    } catch (err) {
      console.error("Failed to create stub for L.Control.Draw:", err);
    }
  }
  
  return isInitialized;
};
