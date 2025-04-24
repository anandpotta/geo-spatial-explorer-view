
import { DrawingData } from '@/types/drawing';
import { isClearedState } from './storage-utils';

export async function syncDrawingsWithBackend(drawings: DrawingData[]): Promise<void> {
  try {
    const response = await fetch('/api/drawings/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(drawings),
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log('Response from backend is not JSON, skipping sync');
      return;
    }
    
    if (!response.ok) {
      console.error('Failed to sync drawings with backend:', await response.text());
      return;
    }
    
    console.log('Drawings successfully synced with backend');
  } catch (error) {
    console.error('Error syncing drawings with backend:', error);
  }
}

export async function fetchDrawingsFromBackend(): Promise<void> {
  if (isClearedState()) return;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/api/drawings', {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log('Response from backend is not JSON, using local storage');
      return;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch drawings from backend');
    }
    
    const drawings = await response.json();
    localStorage.setItem('savedDrawings', JSON.stringify(drawings));
    console.log('Drawings successfully fetched from backend');
  } catch (error) {
    console.error('Error fetching drawings from backend:', error);
  }
}

export async function deleteDrawingFromBackend(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/drawings/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete drawing from backend');
    }
    
    console.log('Drawing successfully deleted from backend');
  } catch (error) {
    console.error('Error deleting drawing from backend:', error);
  }
}

export async function clearAllDrawingsFromBackend(): Promise<void> {
  try {
    const response = await fetch('/api/drawings/clear', {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear all drawings from backend');
    }
    
    console.log('All drawings successfully cleared from backend');
  } catch (error) {
    console.error('Error clearing all drawings from backend:', error);
  }
}
