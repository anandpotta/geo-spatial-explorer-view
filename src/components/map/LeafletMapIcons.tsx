import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Create a single instance of the default icon that all markers can reference
export const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Keep track of icon instances to prevent duplication
const iconInstances = new Map();

// Get an icon by key, creating it only if needed
export const getOrCreateIcon = (key: string = 'default') => {
  if (!iconInstances.has(key)) {
    iconInstances.set(key, DefaultIcon);
  }
  return iconInstances.get(key);
};

export const setupLeafletIcons = () => {
  // Set default marker icon once
  L.Marker.prototype.options.icon = DefaultIcon;
  
  // Clean up any duplicate marker icons
  const cleanupDuplicateIcons = () => {
    const iconEls = document.querySelectorAll('.leaflet-marker-icon[src$="marker-icon.png"]');
    const shadowEls = document.querySelectorAll('.leaflet-marker-shadow[src$="marker-shadow.png"]');
    
    // Find duplicates (elements that share the exact same position)
    const positions = new Map();
    
    iconEls.forEach(iconEl => {
      const position = `${iconEl.style.left}-${iconEl.style.top}`;
      if (positions.has(position)) {
        try {
          iconEl.remove();
        } catch (e) {
          console.error('Error removing duplicate marker icon:', e);
        }
      } else {
        positions.set(position, iconEl);
      }
    });
    
    // Clean up any orphaned shadows
    shadowEls.forEach(shadowEl => {
      const position = `${shadowEl.style.left}-${shadowEl.style.top}`;
      if (!positions.has(position)) {
        try {
          shadowEl.remove();
        } catch (e) {
          console.error('Error removing orphaned marker shadow:', e);
        }
      }
    });
  };
  
  // Apply the cleanup when markers are updated
  window.addEventListener('markersUpdated', () => {
    setTimeout(cleanupDuplicateIcons, 100);
  });
  
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
