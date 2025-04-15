
import { LocationMarker } from '../location/types';
import { getConnectionStatus } from '../api-service';
import { syncMarkersWithBackend, fetchMarkersFromBackend } from './sync';

export function saveMarker(marker: LocationMarker): void {
  const savedMarkers = getSavedMarkers();
  savedMarkers.push(marker);
  localStorage.setItem('savedMarkers', JSON.stringify(savedMarkers));
  
  // Sync with backend
  syncMarkersWithBackend(savedMarkers);
}

export function getSavedMarkers(): LocationMarker[] {
  const markersJson = localStorage.getItem('savedMarkers');
  if (!markersJson) {
    // Try to fetch from backend first if localStorage is empty, but don't await
    fetchMarkersFromBackend().catch(() => {
      console.log('Could not fetch markers from backend, using local storage');
    });
    return [];
  }
  
  try {
    const markers = JSON.parse(markersJson);
    return markers.map((marker: any) => ({
      ...marker,
      createdAt: new Date(marker.createdAt)
    }));
  } catch (e) {
    console.error('Failed to parse saved markers', e);
    return [];
  }
}

export function deleteMarker(id: string): void {
  const savedMarkers = getSavedMarkers();
  const filteredMarkers = savedMarkers.filter(marker => marker.id !== id);
  localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
  
  // Sync deletion with backend
  deleteMarkerFromBackend(id);
}
