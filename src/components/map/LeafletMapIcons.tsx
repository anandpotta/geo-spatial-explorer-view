
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet icon issues
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export const setupLeafletIcons = () => {
  // Set default marker icon
  L.Marker.prototype.options.icon = DefaultIcon;
  
  // Ensure Leaflet Draw CSS and icons are properly loaded
  const ensureDrawResources = () => {
    // Check if leaflet-draw CSS is loaded
    const existingDrawCSS = document.querySelector('link[href*="leaflet.draw"]');
    if (!existingDrawCSS) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
      document.head.appendChild(link);
    }

    // Add comprehensive styles for Leaflet Draw icons
    const drawIconStyles = document.createElement('style');
    drawIconStyles.textContent = `
      /* Leaflet Draw Toolbar Icons */
      .leaflet-draw-toolbar {
        margin-top: 12px;
      }
      
      .leaflet-draw-toolbar a {
        background-image: url('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/images/spritesheet.png') !important;
        background-repeat: no-repeat !important;
        width: 26px !important;
        height: 26px !important;
        display: block !important;
        text-indent: 27px !important;
        text-decoration: none !important;
        color: black !important;
        background-color: #fff !important;
        border: 2px solid rgba(0,0,0,0.2) !important;
        border-radius: 4px !important;
        cursor: pointer !important;
      }
      
      .leaflet-draw-toolbar a:hover {
        background-color: #f4f4f4 !important;
      }
      
      /* Individual icon positions */
      .leaflet-draw-draw-polyline {
        background-position: -2px -2px !important;
      }
      
      .leaflet-draw-draw-polygon {
        background-position: -31px -2px !important;
      }
      
      .leaflet-draw-draw-rectangle {
        background-position: -62px -2px !important;
      }
      
      .leaflet-draw-draw-circle {
        background-position: -92px -2px !important;
      }
      
      .leaflet-draw-draw-marker {
        background-position: -122px -2px !important;
      }
      
      .leaflet-draw-edit-edit {
        background-position: -152px -2px !important;
      }
      
      .leaflet-draw-edit-remove {
        background-position: -182px -2px !important;
      }
      
      /* Disabled states */
      .leaflet-draw-edit-edit.leaflet-disabled {
        background-position: -212px -2px !important;
      }
      
      .leaflet-draw-edit-remove.leaflet-disabled {
        background-position: -242px -2px !important;
      }
      
      /* Ensure proper display */
      .leaflet-draw-section {
        position: relative !important;
      }
      
      .leaflet-draw-actions {
        display: block !important;
      }
      
      .leaflet-draw-actions li {
        display: inline-block !important;
      }
      
      /* Fix for missing icons fallback */
      .leaflet-draw-toolbar a[title*="polyline"]:before {
        content: "📏";
        position: absolute;
        left: 6px;
        top: 4px;
        font-size: 14px;
      }
      
      .leaflet-draw-toolbar a[title*="polygon"]:before {
        content: "⬟";
        position: absolute;
        left: 6px;
        top: 4px;
        font-size: 14px;
      }
      
      .leaflet-draw-toolbar a[title*="rectangle"]:before {
        content: "▭";
        position: absolute;
        left: 6px;
        top: 4px;
        font-size: 14px;
      }
      
      .leaflet-draw-toolbar a[title*="circle"]:before {
        content: "○";
        position: absolute;
        left: 6px;
        top: 4px;
        font-size: 14px;
      }
      
      .leaflet-draw-toolbar a[title*="marker"]:before {
        content: "📍";
        position: absolute;
        left: 6px;
        top: 2px;
        font-size: 12px;
      }
      
      .leaflet-draw-toolbar a[title*="Edit"]:before {
        content: "✏️";
        position: absolute;
        left: 6px;
        top: 4px;
        font-size: 12px;
      }
      
      .leaflet-draw-toolbar a[title*="Delete"]:before {
        content: "🗑️";
        position: absolute;
        left: 6px;
        top: 4px;
        font-size: 12px;
      }
    `;
    
    // Remove existing styles to avoid duplicates
    const existingStyles = document.querySelector('#leaflet-draw-icons-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    drawIconStyles.id = 'leaflet-draw-icons-styles';
    document.head.appendChild(drawIconStyles);
  };

  // Call the function to ensure resources are loaded
  ensureDrawResources();
  
  // Re-run after a delay to ensure DOM is ready
  setTimeout(ensureDrawResources, 1000);
};
