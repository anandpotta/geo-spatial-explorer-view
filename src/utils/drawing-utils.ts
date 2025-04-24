
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
  
  // Sync with backend
  syncDrawingsWithBackend(savedDrawings);
}

export function getSavedDrawings(): DrawingData[] {
  const drawingsJson = localStorage.getItem('savedDrawings');
  if (!drawingsJson) {
    // Try to fetch from backend first if localStorage is empty
    fetchDrawingsFromBackend();
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
  
  // Sync deletion with backend
  deleteDrawingFromBackend(id);
}

// New function to clear all drawings at once
export function clearAllDrawings(): void {
  localStorage.setItem('savedDrawings', JSON.stringify([]));
  
  // Notify components about storage changes
  window.dispatchEvent(new Event('storage'));
  
  // Also tell backend to clear all drawings (optional, depending on your backend design)
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
    
    if (!response.ok) {
      throw new Error('Failed to sync drawings with backend');
    }
    
    console.log('Drawings successfully synced with backend');
  } catch (error) {
    console.error('Error syncing drawings with backend:', error);
  }
}

async function fetchDrawingsFromBackend(): Promise<void> {
  try {
    const response = await fetch('/api/drawings');
    
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

// New function to request clearing all drawings from the backend
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
    // Continue anyway since local storage is cleared
  }
}
