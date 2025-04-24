
import { v4 as uuidv4 } from 'uuid';

export interface DrawingData {
  id: string;
  type: 'polygon' | 'circle' | 'rectangle' | 'marker';
  coordinates: Array<[number, number]>;
  geoJSON?: any;
  options?: any;
  properties: {
    name?: string;
    description?: string;
    color?: string;
    createdAt: Date;
    associatedMarkerId?: string;
  };
}

let hasBeenCleared = false;
let clearTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function saveDrawing(drawing: DrawingData): void {
  if (hasBeenCleared) {
    console.log('Canceling clear state due to new drawing being saved');
    hasBeenCleared = false;
    if (clearTimeoutId) {
      clearTimeout(clearTimeoutId);
      clearTimeoutId = null;
    }
  }
  
  const savedDrawings = getSavedDrawings();
  
  // Make sure we're not storing any circular references
  const safeDrawing = {
    ...drawing,
    // Make sure dates are correctly serialized
    properties: {
      ...drawing.properties,
      createdAt: drawing.properties.createdAt instanceof Date 
        ? drawing.properties.createdAt 
        : new Date(drawing.properties.createdAt)
    }
  };
  
  const existingIndex = savedDrawings.findIndex(d => d.id === drawing.id);
  
  if (existingIndex >= 0) {
    savedDrawings[existingIndex] = safeDrawing;
  } else {
    savedDrawings.push(safeDrawing);
  }
  
  try {
    localStorage.setItem('savedDrawings', JSON.stringify(savedDrawings));
    
    const event = new StorageEvent('storage', {
      key: 'savedDrawings',
      newValue: JSON.stringify(savedDrawings)
    });
    window.dispatchEvent(event);
    
    syncDrawingsWithBackend(savedDrawings);
  } catch (error) {
    console.error('Failed to save drawing:', error);
    // If error is due to circular reference, log helpful message
    if (error instanceof TypeError && error.message.includes('circular')) {
      console.error('Circular reference detected. Make sure to serialize properly before saving.');
    }
  }
}

export function getSavedDrawings(): DrawingData[] {
  if (hasBeenCleared) {
    console.log('getSavedDrawings: returning empty array due to recent clear');
    return [];
  }
  
  const drawingsJson = localStorage.getItem('savedDrawings');
  if (!drawingsJson) {
    fetchDrawingsFromBackend().catch(err => {
      console.log('Failed to fetch from backend, using local storage only');
    });
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
  
  const event = new StorageEvent('storage', {
    key: 'savedDrawings',
    newValue: JSON.stringify(filteredDrawings)
  });
  window.dispatchEvent(event);
  
  deleteDrawingFromBackend(id);
}

export function clearAllDrawings(): void {
  console.log('Clearing all drawings from storage');
  localStorage.setItem('savedDrawings', JSON.stringify([]));
  
  // Set the cleared flag and create a timeout to reset it
  hasBeenCleared = true;
  
  // Clear any existing timeout
  if (clearTimeoutId) {
    clearTimeout(clearTimeoutId);
  }
  
  // Set a new timeout to reset the cleared flag
  clearTimeoutId = setTimeout(() => {
    console.log('Resetting hasBeenCleared flag after timeout');
    hasBeenCleared = false;
    clearTimeoutId = null;
  }, 3000); // Increased to 3 seconds for more reliability
  
  // Dispatch storage event to update all components
  const event = new StorageEvent('storage', {
    key: 'savedDrawings',
    newValue: '[]'
  });
  window.dispatchEvent(event);
  
  // Dispatch clear event to notify all components
  const clearEvent = new Event('clearAllDrawings');
  window.dispatchEvent(clearEvent);
  
  clearAllDrawingsFromBackend();
}

async function syncDrawingsWithBackend(drawings: DrawingData[]): Promise<void> {
  try {
    const response = await fetch('/api/drawings/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(drawings),
    });
    
    // Check if the response is JSON before trying to parse it
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

async function fetchDrawingsFromBackend(): Promise<void> {
  if (hasBeenCleared) {
    return;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('/api/drawings', {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Check if the response is JSON before trying to parse it
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

async function deleteDrawingFromBackend(id: string): Promise<void> {
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

async function clearAllDrawingsFromBackend(): Promise<void> {
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
