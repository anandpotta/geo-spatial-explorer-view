
import { DrawingData } from '@/utils/drawing/types';
import { apiCall, getConnectionStatus } from '@/utils/api-service';
import { toast } from '@/components/ui/use-toast';

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
