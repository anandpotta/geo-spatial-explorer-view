
import { LocationMarker } from '@/utils/geo-utils';
import { baseStorageService, getBackendStatus } from '../api/base-service';
import { syncMarkersWithBackend } from '@/utils/storage/sync';

const STORAGE_KEY = 'savedMarkers';

export const markersStorage = {
  getMarkers(): LocationMarker[] {
    return baseStorageService.getFromStorage<LocationMarker>(STORAGE_KEY)
      .map(marker => ({
        ...marker,
        createdAt: new Date(marker.createdAt)
      }));
  },
  
  saveMarker(marker: LocationMarker): void {
    const markers = this.getMarkers();
    markers.push(marker);
    baseStorageService.saveToStorage(STORAGE_KEY, markers, { showToasts: true });
    
    // Sync with backend if available
    const { isAvailable } = getBackendStatus();
    if (isAvailable) {
      syncMarkersWithBackend(markers);
    }
  },
  
  deleteMarker(id: string): void {
    const markers = this.getMarkers();
    const filteredMarkers = markers.filter(marker => marker.id !== id);
    baseStorageService.saveToStorage(STORAGE_KEY, filteredMarkers);
  }
};
