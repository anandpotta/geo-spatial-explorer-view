
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
    try {
      // Fix for the readableArea function that's causing the "type is not defined" error
      if (L.GeometryUtil) {
        L.GeometryUtil.readableArea = function(area: number, isMetric: boolean) {
          const areaStr = isMetric
              ? area >= 10000
                  ? (area / 1000000).toFixed(2) + ' km²'
                  : area.toFixed(2) + ' m²'
              : area < 2589988.11
                  ? (area / 0.836127).toFixed(2) + ' sq ft'
                  : (area / 2589988.11).toFixed(2) + ' sq mi';
          
          return areaStr;
        };
        console.log("Patched Leaflet.GeometryUtil.readableArea");
      }
      
      // Fix for TypeScript errors - use proper type assertion
      const drawPolylinePrototype = L.Draw.Polyline.prototype as any;
      
      if (drawPolylinePrototype) {
        if (!drawPolylinePrototype.options) {
          drawPolylinePrototype.options = {};
        }
        
        drawPolylinePrototype.options.shapeOptions = {
          color: '#3388ff',
          weight: 4,
          opacity: 0.8,
          fill: true,
          fillColor: '#3388ff',
          fillOpacity: 0.3,
          clickable: true,
          zIndexOffset: 2000 // Ensure lines appear above other elements
        };
      }
    } catch (err) {
      console.error('Error setting polyline styles:', err);
    }
  }
};
