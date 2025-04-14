
import { LocationMarker } from '@/utils/geo-utils';
import { apiCall, getConnectionStatus } from '@/utils/api-service';
import { toast } from '@/components/ui/use-toast';

export async function fetchMarkers(): Promise<LocationMarker[]> {
  // Always check local storage first
  const markersJson = localStorage.getItem('savedMarkers');
  const localMarkers = markersJson ? JSON.parse(markersJson) : [];
  
  // Try to fetch from backend if available
  try {
    const { isOnline, isBackendAvailable } = getConnectionStatus();
    if (!isOnline || !isBackendAvailable) {
      return localMarkers;
    }
    
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
  markers.push(marker);
  localStorage.setItem('savedMarkers', JSON.stringify(markers));
  
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
  const markers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
  const filteredMarkers = markers.filter((m: LocationMarker) => m.id !== id);
  localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
  
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
