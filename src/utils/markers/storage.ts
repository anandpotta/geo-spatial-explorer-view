
import { LocationMarker } from './types';
import { getCurrentUser } from '@/services/auth-service';

const STORAGE_KEY = 'geospatial_markers';

export function saveMarker(marker: LocationMarker): void {
  console.log('Saving marker:', marker);
  
  // Allow saving for anonymous users - don't require login
  const currentUser = getCurrentUser();
  const userId = currentUser?.id || 'anonymous';
  
  // Ensure the marker has a userId
  const markerToSave = {
    ...marker,
    userId: marker.userId || userId
  };
  
  try {
    const existingMarkers = getSavedMarkers();
    
    // Remove any existing marker with the same ID to prevent duplicates
    const filteredMarkers = existingMarkers.filter(m => m.id !== markerToSave.id);
    
    // Add the new/updated marker
    filteredMarkers.push(markerToSave);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredMarkers));
    console.log('Marker saved successfully');
    
    // Dispatch event to notify components
    window.dispatchEvent(new Event('markersUpdated'));
  } catch (error) {
    console.error('Error saving marker:', error);
  }
}

export function getSavedMarkers(): LocationMarker[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const markers = saved ? JSON.parse(saved) : [];
    
    // Remove duplicates based on ID
    const uniqueMarkers = markers.filter((marker: LocationMarker, index: number, self: LocationMarker[]) => 
      index === self.findIndex(m => m.id === marker.id)
    );
    
    return uniqueMarkers;
  } catch (error) {
    console.error('Error loading markers:', error);
    return [];
  }
}

export function deleteMarker(markerId: string): void {
  try {
    const existingMarkers = getSavedMarkers();
    const updatedMarkers = existingMarkers.filter(m => m.id !== markerId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMarkers));
    console.log('Marker deleted successfully');
    
    // Dispatch event to notify components
    window.dispatchEvent(new Event('markersUpdated'));
  } catch (error) {
    console.error('Error deleting marker:', error);
  }
}

export function renameMarker(markerId: string, newName: string): void {
  try {
    const existingMarkers = getSavedMarkers();
    const markerIndex = existingMarkers.findIndex(m => m.id === markerId);
    
    if (markerIndex !== -1) {
      existingMarkers[markerIndex].name = newName;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingMarkers));
      console.log('Marker renamed successfully');
      
      // Dispatch event to notify components
      window.dispatchEvent(new Event('markersUpdated'));
    }
  } catch (error) {
    console.error('Error renaming marker:', error);
  }
}
