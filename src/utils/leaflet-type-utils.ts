
import L from 'leaflet';

/**
 * Safely checks if a map instance is valid and ready for use
 */
export function isMapValid(map: any): map is L.Map {
  if (!map) return false;
  
  // Check if map instance exists and has required methods
  if (typeof map.getContainer !== 'function') return false;
  
  try {
    // Check if the container element exists in the DOM
    const container = map.getContainer();
    if (!container || !document.body.contains(container)) {
      return false;
    }
    
    // For maximum safety, check that map has core Leaflet methods
    return typeof map.setView === 'function' && 
           typeof map.addLayer === 'function' && 
           typeof map.getZoom === 'function';
  } catch (err) {
    console.warn('Error checking map validity:', err);
    return false;
  }
}
