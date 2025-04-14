
import { LocationMarker, DrawingData } from './geo-utils';
import { apiCall, getConnectionStatus, checkBackendAvailability } from './api-service';
import { toast } from '@/components/ui/use-toast';

// Function to sync all local data with backend when coming online
export async function syncLocalDataWithBackend(): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) return;
  
  try {
    // Get all local data
    const markersJson = localStorage.getItem('savedMarkers');
    const drawingsJson = localStorage.getItem('savedDrawings');
    
    // Sync markers
    if (markersJson) {
      const markers = JSON.parse(markersJson);
      await apiCall('markers/sync', {
        method: 'POST',
        body: JSON.stringify(markers),
      });
    }
    
    // Sync drawings
    if (drawingsJson) {
      const drawings = JSON.parse(drawingsJson);
      await apiCall('drawings/sync', {
        method: 'POST',
        body: JSON.stringify(drawings),
      });
    }
    
    console.log('All local data synced with backend');
  } catch (error) {
    console.error('Error syncing local data with backend:', error);
    toast({
      variant: "destructive",
      title: "Sync failed",
      description: "Could not sync local data with the server",
    });
  }
}

// Markers API
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
    // Fall back to local storage
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

// Drawings API
export async function fetchDrawings(): Promise<DrawingData[]> {
  // Always check local storage first
  const drawingsJson = localStorage.getItem('savedDrawings');
  const localDrawings = drawingsJson ? JSON.parse(drawingsJson) : [];
  
  // Try to fetch from backend if available
  try {
    const { isOnline, isBackendAvailable } = getConnectionStatus();
    if (!isOnline || !isBackendAvailable) {
      return localDrawings;
    }
    
    const drawings = await apiCall<DrawingData[]>('drawings');
    
    // Update local storage with latest data from server
    localStorage.setItem('savedDrawings', JSON.stringify(drawings));
    return drawings;
  } catch (error) {
    console.error('Error fetching drawings:', error);
    // Fall back to local storage
    return localDrawings;
  }
}

export async function createDrawing(drawing: DrawingData): Promise<DrawingData> {
  // Always save to local storage first
  const drawings = JSON.parse(localStorage.getItem('savedDrawings') || '[]');
  drawings.push(drawing);
  localStorage.setItem('savedDrawings', JSON.stringify(drawings));
  
  // Then try to sync with backend if online
  try {
    const { isOnline, isBackendAvailable } = getConnectionStatus();
    if (isOnline && isBackendAvailable) {
      const serverDrawing = await apiCall<DrawingData>('drawings', {
        method: 'POST',
        body: JSON.stringify(drawing),
      });
      return serverDrawing;
    }
  } catch (error) {
    console.error('Error creating drawing on server:', error);
  }
  
  return drawing;
}

export async function deleteDrawingApi(id: string): Promise<void> {
  // Always delete from local storage first
  const drawings = JSON.parse(localStorage.getItem('savedDrawings') || '[]');
  const filteredDrawings = drawings.filter((d: DrawingData) => d.id !== id);
  localStorage.setItem('savedDrawings', JSON.stringify(filteredDrawings));
  
  // Then try to sync with backend if online
  try {
    const { isOnline, isBackendAvailable } = getConnectionStatus();
    if (isOnline && isBackendAvailable) {
      await apiCall(`drawings/${id}`, {
        method: 'DELETE',
      });
    }
  } catch (error) {
    console.error('Error deleting drawing on server:', error);
  }
}

// Re-export checkBackendAvailability for components that need it
export { checkBackendAvailability };
