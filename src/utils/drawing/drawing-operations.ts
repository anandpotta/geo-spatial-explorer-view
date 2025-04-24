
import { DrawingData } from '@/types/drawing';
import { saveToLocalStorage, getFromLocalStorage, setClearedState } from './storage-utils';
import { syncDrawingsWithBackend, deleteDrawingFromBackend, clearAllDrawingsFromBackend, fetchDrawingsFromBackend } from './backend-sync';

export function saveDrawing(drawing: DrawingData): void {
  const savedDrawings = getSavedDrawings();
  
  const safeDrawing = {
    ...drawing,
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
    saveToLocalStorage(savedDrawings);
    syncDrawingsWithBackend(savedDrawings);
  } catch (error) {
    console.error('Failed to save drawing:', error);
    if (error instanceof TypeError && error.message.includes('circular')) {
      console.error('Circular reference detected. Make sure to serialize properly before saving.');
    }
  }
}

export function getSavedDrawings(): DrawingData[] {
  const drawings = getFromLocalStorage();
  if (drawings.length === 0) {
    fetchDrawingsFromBackend().catch(err => {
      console.log('Failed to fetch from backend, using local storage only');
    });
  }
  return drawings;
}

export function deleteDrawing(id: string): void {
  const savedDrawings = getSavedDrawings();
  const filteredDrawings = savedDrawings.filter(drawing => drawing.id !== id);
  saveToLocalStorage(filteredDrawings);
  deleteDrawingFromBackend(id);
}

export function clearAllDrawings(): void {
  console.log('Clearing all drawings from storage');
  localStorage.setItem('savedDrawings', JSON.stringify([]));
  
  setClearedState(true);
  
  const event = new StorageEvent('storage', {
    key: 'savedDrawings',
    newValue: '[]'
  });
  window.dispatchEvent(event);
  
  const clearEvent = new Event('clearAllDrawings');
  window.dispatchEvent(clearEvent);
  
  clearAllDrawingsFromBackend();
}
