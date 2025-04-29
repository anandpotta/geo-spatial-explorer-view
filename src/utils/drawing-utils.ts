import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { getConnectionStatus } from './api-service';

export interface DrawingData {
  id: string;
  type: 'polygon' | 'circle' | 'rectangle' | 'marker';
  coordinates: Array<[number, number]>;
  geoJSON?: any;
  options?: any;
  svgPath?: string; // Add SVG path data
  properties: {
    name?: string;
    description?: string;
    color?: string;
    createdAt: Date;
    associatedMarkerId?: string;
  };
}

export function saveDrawing(drawing: DrawingData): void {
  const savedDrawings = getSavedDrawings();
  
  // Check if drawing with same ID exists and update it
  const existingIndex = savedDrawings.findIndex(d => d.id === drawing.id);
  
  if (existingIndex >= 0) {
    savedDrawings[existingIndex] = drawing;
  } else {
    savedDrawings.push(drawing);
  }
  
  localStorage.setItem('savedDrawings', JSON.stringify(savedDrawings));
  
  // Notify components about storage changes
  window.dispatchEvent(new Event('storage'));
  
  // Only attempt to sync if we're online
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (isOnline && isBackendAvailable) {
    syncDrawingsWithBackend(savedDrawings)
      .catch(err => {
        // Don't show toast for expected offline errors
        if (navigator.onLine) {
          console.warn('Failed to sync drawings, will retry later:', err);
        }
      });
  }
}

export function getSavedDrawings(): DrawingData[] {
  const drawingsJson = localStorage.getItem('savedDrawings');
  if (!drawingsJson) {
    // Try to fetch from backend first if localStorage is empty
    const { isOnline, isBackendAvailable } = getConnectionStatus();
    if (isOnline && isBackendAvailable) {
      fetchDrawingsFromBackend().catch(err => {
        // Silent fail for initial load
        console.log('Could not fetch drawings from backend, using local storage');
      });
    }
    return [];
  }
  
  try {
    const drawings = JSON.parse(drawingsJson);
    return drawings.map((drawing: any) => ({
      ...drawing,
      properties: {
        ...drawing.properties,
        createdAt: new Date(drawing.properties.createdAt)
      }
    }));
  } catch (e) {
    console.error('Failed to parse saved drawings', e);
    return [];
  }
}

export function deleteDrawing(id: string): void {
  const savedDrawings = getSavedDrawings();
  const filteredDrawings = savedDrawings.filter(drawing => drawing.id !== id);
  localStorage.setItem('savedDrawings', JSON.stringify(filteredDrawings));
  
  // Notify components about storage changes
  window.dispatchEvent(new Event('storage'));
  
  // Only attempt to sync delete if we're online
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (isOnline && isBackendAvailable) {
    deleteDrawingFromBackend(id).catch(err => {
      // Don't show toast for expected offline errors
      if (navigator.onLine) {
        console.warn('Failed to delete drawing from backend, will retry later:', err);
      }
    });
  }
}

async function syncDrawingsWithBackend(drawings: DrawingData[]): Promise<void> {
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

async function fetchDrawingsFromBackend(): Promise<void> {
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

async function deleteDrawingFromBackend(id: string): Promise<void> {
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
