
import { LocationMarker } from '@/utils/geo-utils';
import { apiCall, getConnectionStatus } from '@/utils/api-service';
import { toast } from '@/components/ui/use-toast';

export async function fetchMarkers(): Promise<LocationMarker[]> {
  // Always check local storage first
  const markersJson = localStorage.getItem('savedMarkers');
  const localMarkers = markersJson ? JSON.parse(markersJson) : [];
  
  // Don't even try to fetch from backend if we know it's unavailable
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) {
    console.log('Using local markers only - backend unavailable');
    return localMarkers;
  }
  
  // Try to fetch from backend
  try {
    const markers = await apiCall<LocationMarker[]>('markers');
    
    // Update local storage with latest data from server
    localStorage.setItem('savedMarkers', JSON.stringify(markers));
    return markers;
  } catch (error) {
    console.error('Error fetching markers:', error);
    return localMarkers;
  }
}

export async function createMarker(marker: LocationMarker): Promise<LocationMarker> {
  // Always save to local storage first
  const markers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
  
  // Check if marker already exists
  const existingIndex = markers.findIndex((m: LocationMarker) => m.id === marker.id);
  
  if (existingIndex >= 0) {
    // Update existing marker
    markers[existingIndex] = marker;
  } else {
    // Add new marker
    markers.push(marker);
  }
  
  localStorage.setItem('savedMarkers', JSON.stringify(markers));
  
  // Notify components about storage changes
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('markersUpdated'));
  
  // Then try to sync with backend if online
  try {
    const { isOnline, isBackendAvailable } = getConnectionStatus();
    if (isOnline && isBackendAvailable) {
      const serverMarker = await apiCall<LocationMarker>('markers', {
        method: 'POST',
        body: JSON.stringify(marker),
      });
      return serverMarker;
    }
  } catch (error) {
    console.error('Error creating marker on server:', error);
  }
  
  return marker;
}

export async function deleteMarkerApi(id: string): Promise<void> {
  // Always delete from local storage first
  try {
    const markers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
    const filteredMarkers = markers.filter((m: LocationMarker) => m.id !== id);
    localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
    
    // Add a preventMapClick flag to window for a longer duration
    // This will prevent map click from being triggered after deletion
    window.preventMapClick = true;
    setTimeout(() => {
      window.preventMapClick = false;
    }, 1000); // Extended to 1 second for more reliable prevention
    
    // Notify components about storage changes
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
  } catch (error) {
    console.error('Error deleting marker from local storage:', error);
  }
  
  // Then try to sync with backend if online
  try {
    const { isOnline, isBackendAvailable } = getConnectionStatus();
    if (isOnline && isBackendAvailable) {
      await apiCall(`markers/${id}`, {
        method: 'DELETE',
      });
    }
  } catch (error) {
    console.error('Error deleting marker on server:', error);
  }
}

// Add this to the global Window interface
declare global {
  interface Window {
    preventMapClick?: boolean;
  }
}
