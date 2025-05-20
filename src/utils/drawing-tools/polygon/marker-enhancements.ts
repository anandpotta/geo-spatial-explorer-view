
import L from 'leaflet';

/**
 * Enhances markers used in polygon drawing to ensure they are visible and interactive
 */
export const enhancePolygonMarkers = (): () => void => {
  const cleanups: Array<() => void> = [];
  
  // Fix polygon drawing to improve marker visibility and connection line rendering
  if ((L.Draw as any).Polygon && (L.Draw as any).Polygon.prototype) {
    // Store original method so it can be restored later
    const originalVertexMarker = (L.Draw as any).Polygon.prototype._createMarker;
    
    // Override vertex marker creation to ensure it's created correctly
    if (originalVertexMarker) {
      (L.Draw as any).Polygon.prototype._createMarker = function(latlng: L.LatLng, index?: number) {
        // Create visible markers for each polygon vertex
        const marker = originalVertexMarker.call(this, latlng, index);
        
        if (marker) {
          // Make the marker more visible
          if (marker.options) {
            marker.options.radius = 6;
            marker.options.weight = 2;
            marker.options.color = '#33C3F0';
            marker.options.fillColor = '#fff';
            marker.options.fillOpacity = 1;
            marker.options.opacity = 1;
          }
          
          // Ensure the marker is interactive and visible
          if (marker._icon) {
            marker._icon.style.pointerEvents = 'auto';
            marker._icon.style.cursor = 'pointer';
            marker._icon.style.zIndex = '1000';
            // Force a reflow to ensure styles are applied
            marker._icon.getBoundingClientRect();
          }
        }
        
        return marker;
      };
      
      cleanups.push(() => {
        (L.Draw as any).Polygon.prototype._createMarker = originalVertexMarker;
      });
    }
    
    // Override _addVertex to ensure vertex markers display correctly
    const originalAddVertex = (L.Draw as any).Polygon.prototype._addVertex;
    
    if (originalAddVertex) {
      (L.Draw as any).Polygon.prototype._addVertex = function(latlng: L.LatLng) {
        // Call original method
        const result = originalAddVertex.call(this, latlng);
        
        // Make sure markers are visible and connection lines draw properly
        if (this._markers && this._markers.length > 0) {
          const lastMarker = this._markers[this._markers.length - 1];
          if (lastMarker) {
            // Force the marker to be more visible
            lastMarker.setStyle({
              radius: 6,
              weight: 2,
              color: '#33C3F0',
              fillColor: '#ffffff',
              fillOpacity: 1,
              opacity: 1
            });
            
            // Force a reflow to ensure styles are applied
            if (lastMarker._icon) {
              lastMarker._icon.getBoundingClientRect();
            }
          }
        }
        
        // Ensure polyline visibility between points
        if (this._poly && this._poly._path) {
          this._poly._path.style.stroke = 'rgba(51, 195, 240, 1)';
          this._poly._path.style.strokeWidth = '4px';
          this._poly._path.style.strokeDasharray = '';
          this._poly._path.style.strokeLinecap = 'round';
          this._poly._path.style.strokeLinejoin = 'round';
        }
        
        return result;
      };
      
      cleanups.push(() => {
        (L.Draw as any).Polygon.prototype._addVertex = originalAddVertex;
      });
    }
  }
  
  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
};
