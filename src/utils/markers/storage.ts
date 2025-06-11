
import { LocationMarker } from './types';
import { toast } from 'sonner';

export function getSavedMarkers(): LocationMarker[] {
  const markersJson = localStorage.getItem('savedMarkers');
  
  if (!markersJson) {
    return [];
  }
  
  try {
    let markers = JSON.parse(markersJson);
    
    // Map the dates
    markers = markers.map((marker: any) => ({
      ...marker,
      createdAt: new Date(marker.createdAt)
    }));
    
    // Deduplicate markers by ID - this helps prevent duplicates
    const uniqueMarkers = new Map<string, LocationMarker>();
    markers.forEach((marker: LocationMarker) => {
      uniqueMarkers.set(marker.id, marker);
    });
    
    return Array.from(uniqueMarkers.values());
  } catch (e) {
    console.error('Failed to parse saved markers', e);
    return [];
  }
}

export function saveMarker(marker: LocationMarker): void {
  // Ensure the marker has a user ID (use anonymous for no auth)
  const markerWithUser = {
    ...marker,
    userId: marker.userId || 'anonymous'
  };
  
  // Get existing markers and deduplicate before saving
  const savedMarkers = getSavedMarkers();
  
  // Check if marker with same ID exists and update it
  const existingIndex = savedMarkers.findIndex(m => m.id === markerWithUser.id);
  
  if (existingIndex >= 0) {
    // Update existing marker
    savedMarkers[existingIndex] = markerWithUser;
  } else {
    // Add new marker
    savedMarkers.push(markerWithUser);
  }
  
  // Deduplicate markers before saving to ensure no duplicates
  const uniqueMarkers = new Map<string, LocationMarker>();
  savedMarkers.forEach(m => uniqueMarkers.set(m.id, m));
  
  localStorage.setItem('savedMarkers', JSON.stringify(Array.from(uniqueMarkers.values())));
  
  // Notify components about storage changes
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('markersUpdated'));
  
  console.log('Marker saved successfully:', markerWithUser.id);
}

export function renameMarker(id: string, newName: string): void {
  const savedMarkers = getSavedMarkers();
  const markerIndex = savedMarkers.findIndex(marker => marker.id === id);
  
  if (markerIndex === -1) {
    console.error('Marker not found');
    toast.error('Location not found');
    return;
  }
  
  // Update the marker name
  savedMarkers[markerIndex] = {
    ...savedMarkers[markerIndex],
    name: newName
  };
  
  localStorage.setItem('savedMarkers', JSON.stringify(savedMarkers));
  
  // Notify components about storage changes
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('markersUpdated'));
  
  toast.success('Location renamed successfully');
}

export function deleteMarker(id: string): void {
  const savedMarkers = getSavedMarkers();
  const filteredMarkers = savedMarkers.filter(marker => marker.id !== id);
  localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
  
  // Notify components about storage changes
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('markersUpdated'));
  
  toast.success('Location deleted successfully');
}
