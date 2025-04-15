
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
  L.Marker.prototype.options.icon = DefaultIcon;
};

// Add polyline styles to ensure lines are visible
export const setupDrawingStyles = () => {
  // Apply default styles for drawing
  if (L.Draw) {
    if (L.Draw.Polyline) {
      // Fix: Access the correct property path for shape options
      // The prototype object structure in Leaflet.Draw is different
      try {
        // Set shape options using the correct property path
        const drawPolylinePrototype = L.Draw.Polyline.prototype;
        if (drawPolylinePrototype) {
          // Some versions of Leaflet.Draw use this structure
          if (!drawPolylinePrototype.options) {
            drawPolylinePrototype.options = {};
          }
          
          drawPolylinePrototype.options.shapeOptions = {
            color: '#1EAEDB',
            weight: 4,
            opacity: 0.8,
            fill: true,
            fillColor: '#1EAEDB',
            fillOpacity: 0.3,
            clickable: true
          };
        }
      } catch (err) {
        console.error('Error setting polyline styles:', err);
      }
    }
  }
};
