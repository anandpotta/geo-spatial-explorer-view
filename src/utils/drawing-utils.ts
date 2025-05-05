
import { toast } from 'sonner';
import { DrawingData } from './drawing-types';
import { getConnectionStatus } from './api-service';
import { getSavedDrawings, saveDrawingsToStorage } from './drawing-storage';
import { 
  syncDrawingsWithBackend, 
  fetchDrawingsFromBackend, 
  deleteDrawingFromBackend 
} from './drawing-sync';

export type { DrawingData } from './drawing-types';
export { getSavedDrawings } from './drawing-storage';

/**
 * Save a drawing to storage and sync with backend if online
 */
export function saveDrawing(drawing: DrawingData): void {
  const savedDrawings = getSavedDrawings();
  
  // Check if drawing with same ID exists and update it
  const existingIndex = savedDrawings.findIndex(d => d.id === drawing.id);
  
  if (existingIndex >= 0) {
    savedDrawings[existingIndex] = drawing;
  } else {
    savedDrawings.push(drawing);
  }
  
  // Save to local storage
  saveDrawingsToStorage(savedDrawings);
  
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

/**
 * Delete a drawing by ID
 */
export function deleteDrawing(id: string): void {
  const savedDrawings = getSavedDrawings();
  const filteredDrawings = savedDrawings.filter(drawing => drawing.id !== id);
  
  // Save to local storage
  saveDrawingsToStorage(filteredDrawings);
  
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
