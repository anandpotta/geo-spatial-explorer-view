
import { Map } from 'leaflet';
import '../types/leaflet-extended.d.ts';

export function useMapContainer() {
  const isContainerValid = (map: Map | null) => {
    if (!map) return false;
    
    try {
      const container = map.getContainer();
      return container && 
             document.contains(container) && 
             container.offsetWidth > 0 && 
             container.offsetHeight > 0 &&
             window.getComputedStyle(container).display !== 'none' &&
             window.getComputedStyle(container).visibility !== 'hidden';
    } catch (err) {
      console.error('Error checking map container:', err);
      return false;
    }
  };

  const ensureContainerVisibility = (map: Map | null) => {
    if (!map) return;
    
    try {
      const container = map.getContainer();
      if (container) {
        container.style.visibility = 'visible';
        container.style.display = 'block';
        container.style.opacity = '1';
        void container.offsetHeight;
      }
    } catch (err) {
      console.error('Error ensuring container visibility:', err);
    }
  };

  return {
    isContainerValid,
    ensureContainerVisibility
  };
}
