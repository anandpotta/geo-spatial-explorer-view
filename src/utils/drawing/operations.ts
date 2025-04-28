
import { DrawingData } from './types';
import { getSavedDrawings, saveToLocalStorage } from './storage';
import { syncDrawingsWithBackend, deleteDrawingFromBackend } from './sync';
import { getConnectionStatus } from '../api-service';

export function saveDrawing(drawing: DrawingData): void {
  const savedDrawings = getSavedDrawings();
  const existingIndex = savedDrawings.findIndex(d => d.id === drawing.id);
  
  if (existingIndex >= 0) {
    savedDrawings[existingIndex] = drawing;
  } else {
    savedDrawings.push(drawing);
  }
  
  saveToLocalStorage(savedDrawings);
  
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (isOnline && isBackendAvailable) {
    syncDrawingsWithBackend(savedDrawings)
      .catch(err => {
        if (navigator.onLine) {
          console.warn('Failed to sync drawings, will retry later:', err);
        }
      });
  }
}

export function deleteDrawing(id: string): void {
  const savedDrawings = getSavedDrawings();
  const filteredDrawings = savedDrawings.filter(drawing => drawing.id !== id);
  saveToLocalStorage(filteredDrawings);
  
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (isOnline && isBackendAvailable) {
    deleteDrawingFromBackend(id).catch(err => {
      if (navigator.onLine) {
        console.warn('Failed to delete drawing from backend, will retry later:', err);
      }
    });
  }
}

export { getSavedDrawings };
