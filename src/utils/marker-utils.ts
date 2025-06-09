
import { LocationMarker } from '@/utils/geo-utils';

// Export LocationMarker type for other modules
export type { LocationMarker } from '@/utils/geo-utils';

export const saveMarker = (marker: LocationMarker) => {
  // Generate unique identifier for the marker if it doesn't exist
  if (!marker.uniqueId) {
    marker.uniqueId = `marker-${marker.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  console.log(`Saving marker with unique ID: ${marker.uniqueId}`);
  
  try {
    const existingMarkers = getSavedMarkers();
    const updatedMarkers = existingMarkers.filter(m => m.id !== marker.id);
    updatedMarkers.push(marker);
    
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    
    // Dispatch event to notify components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
  } catch (error) {
    console.error('Error saving marker:', error);
  }
};

export const getSavedMarkers = (): LocationMarker[] => {
  try {
    const saved = localStorage.getItem('savedMarkers');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading markers:', error);
    return [];
  }
};

export const deleteMarker = (id: string): void => {
  try {
    const markers = getSavedMarkers();
    const filteredMarkers = markers.filter(marker => marker.id !== id);
    localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
    
    // Dispatch event to notify components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
  } catch (error) {
    console.error('Error deleting marker:', error);
  }
};

export const createMarker = (marker: LocationMarker): LocationMarker => {
  saveMarker(marker);
  return marker;
};

export const renameMarker = (id: string, newName: string): void => {
  try {
    const markers = getSavedMarkers();
    const updatedMarkers = markers.map(marker => {
      if (marker.id === id) {
        return { ...marker, name: newName };
      }
      return marker;
    });
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    
    // Dispatch event to notify components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
  } catch (error) {
    console.error('Error renaming marker:', error);
  }
};
