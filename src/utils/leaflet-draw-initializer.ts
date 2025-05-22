
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
  
  // If L.Control.Draw is not available, create a compatible stub version
  if (!isInitialized && L && L.Control && !L.Control.Draw) {
    try {
      console.warn("Creating stub for L.Control.Draw");
      
      // Instead of using extend, create a new class that inherits all Control methods
      class DrawControl extends L.Control {
        options: any;
        
        constructor(options?: any) {
          super(options);
          this.options = options || {};
        }
        
        initialize(options?: any): void {
          L.Util.setOptions(this, options || {});
          console.log("Draw control initialized with options:", options);
        }
        
        onAdd(map: L.Map): HTMLElement {
          const container = L.DomUtil.create('div', 'leaflet-draw');
          console.log("Draw control added to map");
          return container;
        }
        
        onRemove(): void {
          console.log("Draw control removed from map");
        }
        
        setDrawingOptions(options: any): any {
          console.log("Setting drawing options:", options);
          if (options && this.options) {
            this.options = { ...this.options, ...options };
          }
          return this;
        }
        
        // These methods are already inherited from L.Control
        // but we'll define them here to satisfy TypeScript
        getPosition(): string {
          return this.options.position || 'topright';
        }
        
        setPosition(position: string): this {
          this.options.position = position;
          return this;
        }
        
        getContainer(): HTMLElement | null {
          return this._container || null;
        }
        
        addTo(map: L.Map): this {
          this.remove();
          this._map = map;
          
          const container = this.onAdd(map);
          const pos = this.getPosition();
          const corner = map._controlCorners[pos];
          
          container.classList.add('leaflet-control');
          if (pos.indexOf('bottom') !== -1) {
            corner.insertBefore(container, corner.firstChild);
          } else {
            corner.appendChild(container);
          }
          
          this._container = container;
          return this;
        }
        
        remove(): this {
          if (!this._map) {
            return this;
          }
          
          if (this._container) {
            this._container.remove();
          }
          
          this.onRemove();
          this._map = undefined as any;
          
          return this;
        }
      }
      
      // Assign our custom class to L.Control.Draw
      L.Control.Draw = DrawControl;
      
    } catch (err) {
      console.error("Failed to create stub for L.Control.Draw:", err);
    }
  }
  
  return isInitialized;
};
