
import { DrawingData } from './types';
import { getCurrentUser } from '../../services/auth-service';
import { toast } from 'sonner';
import { syncDrawingsWithBackend, fetchDrawingsFromBackend, deleteDrawingFromBackend } from './sync';
import { getConnectionStatus } from '../api-service';

export function saveDrawing(drawing: DrawingData): void {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot save drawing: No user is logged in');
    toast.error('Please log in to save your drawings');
    return;
  }
  
  // Ensure the drawing has the current user's ID
  const drawingWithUser = {
    ...drawing,
    userId: currentUser.id
  };
  
  const savedDrawings = getSavedDrawings();
  
  // Check if drawing with same ID exists and update it
  const existingIndex = savedDrawings.findIndex(d => d.id === drawingWithUser.id);
  
  if (existingIndex >= 0) {
    savedDrawings[existingIndex] = drawingWithUser;
  } else {
    savedDrawings.push(drawingWithUser);
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
  const currentUser = getCurrentUser();
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
    let drawings = JSON.parse(drawingsJson);
    // Map the dates
    drawings = drawings.map((drawing: any) => ({
      ...drawing,
      properties: {
        ...drawing.properties,
        createdAt: new Date(drawing.properties.createdAt)
      }
    }));
    
    // Filter drawings by user if a user is logged in
    if (currentUser) {
      drawings = drawings.filter((drawing: DrawingData) => drawing.userId === currentUser.id);
    }
    
    return drawings;
  } catch (e) {
    console.error('Failed to parse saved drawings', e);
    return [];
  }
}

export function deleteDrawing(id: string): void {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot delete drawing: No user is logged in');
    toast.error('Please log in to manage your drawings');
    return;
  }
  
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
