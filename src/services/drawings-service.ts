
import { DrawingData } from '@/utils/geo-utils';
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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/api/drawings', {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Check if the response is actually JSON before trying to parse it
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log('Backend returned non-JSON response, using local drawings');
      return localDrawings;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch drawings: ${response.status} ${response.statusText}`);
    }
    
    const drawings = await response.json();
    
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/drawings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(drawing),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check if the response is JSON before trying to parse it
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json') && response.ok) {
        return await response.json();
      }
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`/api/drawings/${id}`, {
        method: 'DELETE',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn('Backend may not have deleted the drawing:', response.status);
      }
    }
  } catch (error) {
    console.error('Error deleting drawing on server:', error);
  }
}
