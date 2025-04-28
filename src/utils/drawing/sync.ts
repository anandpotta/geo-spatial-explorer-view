
import { toast } from 'sonner';
import { getConnectionStatus } from '../api-service';
import { DrawingData } from './types';

export async function syncDrawingsWithBackend(drawings: DrawingData[]): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) {
    return;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/api/drawings/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(drawings),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    console.log('Drawings successfully synced with backend');
  } catch (error) {
    if (!navigator.onLine || error instanceof TypeError) {
      console.log('Cannot sync drawings while offline');
      return;
    }
    
    console.error('Error syncing drawings with backend:', error);
    throw new Error('Failed to sync drawings with backend');
  }
}

export async function deleteDrawingFromBackend(id: string): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) {
    return;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`/api/drawings/${id}`, {
      method: 'DELETE',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    console.log('Drawing successfully deleted from backend');
  } catch (error) {
    if (!navigator.onLine || error instanceof TypeError) {
      console.log('Cannot delete drawing while offline');
      return;
    }
    
    console.error('Error deleting drawing from backend:', error);
    throw new Error('Failed to delete drawing from backend');
  }
}
