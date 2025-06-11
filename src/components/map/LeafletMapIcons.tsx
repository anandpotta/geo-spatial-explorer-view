
import L from 'leaflet';

// Fix Leaflet icon issues by using the default marker icon URL
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
const iconShadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export const setupLeafletIcons = () => {
  // Set default marker icon
  L.Marker.prototype.options.icon = DefaultIcon;
  
  // Fix Leaflet Draw icons by setting the correct icon path
  if (L.drawVersion && typeof L.drawLocal !== 'undefined') {
    // Only run if Leaflet Draw is loaded
    // Set default path for icons
    if (L.Draw && L.Draw.Polyline) {
      // This ensures the draw control icons are properly displayed
      const elementStyles = document.createElement('style');
      elementStyles.textContent = `
        .leaflet-draw-toolbar .leaflet-draw-draw-polyline { background-position: -2px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-draw-polygon { background-position: -31px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-draw-rectangle { background-position: -62px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-draw-circle { background-position: -92px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-draw-marker { background-position: -122px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-edit-edit { background-position: -152px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-edit-remove { background-position: -182px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-edit-edit.leaflet-disabled { background-position: -212px -2px; }
        .leaflet-draw-toolbar .leaflet-draw-edit-remove.leaflet-disabled { background-position: -242px -2px; }
      `;
      document.head.appendChild(elementStyles);
    }
  }
};
