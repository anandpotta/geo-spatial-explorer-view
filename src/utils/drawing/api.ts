
import { DrawingData } from './types';
import { getConnectionStatus } from '../api-service';
import { toast } from 'sonner';

export async function syncDrawingsWithBackend(drawings: DrawingData[]): Promise<void> {
  // Check connection status first
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) {
    return; // Silently return if offline
  }
  
  try {
    // Add a timeout to the fetch to avoid hanging requests
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
    // Check if this is a network error 
    if (!navigator.onLine || error instanceof TypeError) {
      // Silently handle expected offline errors
      console.log('Cannot sync drawings while offline');
      return;
    }
    
    console.error('Error syncing drawings with backend:', error);
    throw new Error('Failed to sync drawings with backend');
  }
}

export async function fetchDrawingsFromBackend(): Promise<void> {
  // Check connection status first
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) {
    return; // Silently return if offline
  }
  
  try {
    // Add a timeout to the fetch to avoid hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/api/drawings', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const drawings = await response.json();
    localStorage.setItem('savedDrawings', JSON.stringify(drawings));
    console.log('Drawings successfully fetched from backend');
  } catch (error) {
    // Check if this is a network error
    if (!navigator.onLine || error instanceof TypeError) {
      // Silently handle expected offline errors
      console.log('Cannot fetch drawings while offline');
      return;
    }
    
    console.error('Error fetching drawings from backend:', error);
    throw new Error('Failed to fetch drawings from backend');
  }
}

export async function deleteDrawingFromBackend(id: string): Promise<void> {
  // Check connection status first
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) {
    return; // Silently return if offline
  }
  
  try {
    // Add a timeout to the fetch to avoid hanging requests
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
    // Check if this is a network error
    if (!navigator.onLine || error instanceof TypeError) {
      // Silently handle expected offline errors
      console.log('Cannot delete drawing while offline');
      return;
    }
    
    console.error('Error deleting drawing from backend:', error);
    throw new Error('Failed to delete drawing from backend');
  }
}
