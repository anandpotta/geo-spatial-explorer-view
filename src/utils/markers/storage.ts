
import { LocationMarker } from './types';

const STORAGE_KEY = 'savedMarkers';

/**
 * Get all saved markers from localStorage
 */
export function getSavedMarkers(): LocationMarker[] {
  try {
    const markersJson = localStorage.getItem(STORAGE_KEY);
    return markersJson ? JSON.parse(markersJson) : [];
  } catch (error) {
    console.error('Error loading markers from localStorage:', error);
    return [];
  }
}

/**
 * Save a marker to localStorage
 */
export function saveMarker(marker: LocationMarker): void {
  try {
    const markers = getSavedMarkers();
    
    // Check if marker already exists
    const existingIndex = markers.findIndex(m => m.id === marker.id);
    
    if (existingIndex >= 0) {
      // Update existing marker
      markers[existingIndex] = marker;
    } else {
      // Add new marker
      markers.push(marker);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
    
    // Dispatch events to notify other components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
  } catch (error) {
    console.error('Error saving marker to localStorage:', error);
  }
}

/**
 * Delete a marker from localStorage
 */
export function deleteMarker(id: string): void {
  try {
    const markers = getSavedMarkers();
    const updatedMarkers = markers.filter(marker => marker.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMarkers));
    
    // Dispatch events to notify other components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
  } catch (error) {
    console.error('Error deleting marker from localStorage:', error);
  }
}

/**
 * Rename a marker in localStorage
 */
export function renameMarker(id: string, newName: string): void {
  try {
    const markers = getSavedMarkers();
    const updatedMarkers = markers.map(marker => 
      marker.id === id ? { ...marker, name: newName } : marker
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMarkers));
    
    // Dispatch events to notify other components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
  } catch (error) {
    console.error('Error renaming marker in localStorage:', error);
  }
}
