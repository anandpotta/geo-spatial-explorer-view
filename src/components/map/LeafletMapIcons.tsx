
import L from 'leaflet';

// Fix Leaflet icon issues by using the default marker icon URL
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
const iconShadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

// Create a custom icon class that adds UIDs
const createIconWithUID = () => {
  const iconUID = crypto.randomUUID();
  
  return L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    // Add custom options to track UIDs
    className: `leaflet-marker-icon-${iconUID}`,
  });
};

const DefaultIcon = L.icon({
  iconUrl: iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export const setupLeafletIcons = () => {
  // Set default marker icon
  L.Marker.prototype.options.icon = DefaultIcon;
  
  // Override the marker creation to add UIDs to all marker elements
  const originalMarkerInitialize = L.Marker.prototype.initialize;
  L.Marker.prototype.initialize = function(latlng, options) {
    // Call the original initialize method
    originalMarkerInitialize.call(this, latlng, options);
    
    // Add UID tracking
    this._markerUID = crypto.randomUUID();
    this._iconUID = crypto.randomUUID();
    this._imageUID = crypto.randomUUID();
    
    // Override the _initIcon method to add UIDs
    const originalInitIcon = this._initIcon;
    this._initIcon = function() {
      originalInitIcon.call(this);
      
      // Add UIDs to the marker icon element
      if (this._icon) {
        this._icon.setAttribute('data-marker-uid', this._markerUID);
        this._icon.setAttribute('data-icon-uid', this._iconUID);
        this._icon.setAttribute('data-marker-type', 'leaflet-default');
        this._icon.id = `marker-icon-${this._iconUID}`;
        
        // Add UID to the image element inside the icon
        const imgElement = this._icon.querySelector('img');
        if (imgElement) {
          imgElement.setAttribute('data-image-uid', this._imageUID);
          imgElement.setAttribute('data-marker-img-uid', this._imageUID);
          imgElement.setAttribute('data-image-type', 'marker-icon');
          imgElement.id = `marker-image-${this._imageUID}`;
        }
        
        console.log(`Leaflet marker icon configured with UIDs: marker=${this._markerUID}, icon=${this._iconUID}, image=${this._imageUID}`);
      }
      
      // Add UID to shadow element
      if (this._shadow) {
        this._shadow.setAttribute('data-marker-uid', this._markerUID);
        this._shadow.setAttribute('data-shadow-for', this._markerUID);
        this._shadow.setAttribute('data-image-uid', `${this._imageUID}-shadow`);
        this._shadow.id = `marker-shadow-${this._markerUID}`;
      }
    };
  };
  
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

export { createIconWithUID };
