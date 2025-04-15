
import { LocationMarker } from '@/utils/geo-utils';
import { apiCall } from '@/utils/api-service';
import { markersStorage } from './markers-storage';
import { getBackendStatus } from '../api/base-service';

export async function fetchMarkers(): Promise<LocationMarker[]> {
  // Always check local storage first
  const localMarkers = markersStorage.getMarkers();
  
  // Don't try to fetch from backend if we know it's unavailable
  const { isAvailable } = getBackendStatus();
  if (!isAvailable) {
    console.log('Using local markers only - backend unavailable');
    return localMarkers;
  }
  
  // Try to fetch from backend
  try {
    const markers = await apiCall<LocationMarker[]>('markers');
    markersStorage.saveMarker(markers);
    return markers;
  } catch (error) {
    console.error('Error fetching markers:', error);
    return localMarkers;
  }
}

export async function createMarker(marker: LocationMarker): Promise<LocationMarker> {
  // Always save to local storage first
  markersStorage.saveMarker(marker);
  
  // Then try to sync with backend if online
  try {
    const { isAvailable } = getBackendStatus();
    if (isAvailable) {
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
  markersStorage.deleteMarker(id);
  
  // Then try to sync with backend if online
  try {
    const { isAvailable } = getBackendStatus();
    if (isAvailable) {
      await apiCall(`markers/${id}`, {
        method: 'DELETE',
      });
    }
  } catch (error) {
    console.error('Error deleting marker on server:', error);
  }
}
