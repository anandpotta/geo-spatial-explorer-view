
import { getSavedMarkers, deleteMarker } from '@/utils/marker-utils';

/**
 * Clears all markers from storage and the map
 */
export function clearAllMarkers() {
  try {
    // Get all markers from storage
    const markers = getSavedMarkers();
    
    // Delete each marker
    markers.forEach(marker => {
      deleteMarker(marker.id);
    });
    
    // Clean up all marker tooltips
    const tooltips = document.querySelectorAll('.marker-tooltip');
    tooltips.forEach(tooltip => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });
    
    // Clear markers from storage
    localStorage.removeItem('savedMarkers');
    
    // Dispatch event to notify components
    window.dispatchEvent(new Event('markersUpdated'));
    
    return true;
  } catch (error) {
    console.error('Error clearing markers:', error);
    return false;
  }
}
