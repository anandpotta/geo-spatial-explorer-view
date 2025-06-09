
import { DrawingData } from './types';
import { getCurrentUser } from '@/services/auth-service';

const STORAGE_KEY = 'geospatial_drawings';

export function saveDrawing(drawing: DrawingData): void {
  console.log('Saving drawing:', drawing);
  
  // Allow saving for anonymous users - don't require login
  const currentUser = getCurrentUser();
  const userId = currentUser?.id || 'anonymous';
  
  // Ensure the drawing has a userId
  const drawingToSave = {
    ...drawing,
    userId: drawing.userId || userId
  };
  
  try {
    const existingDrawings = getSavedDrawings();
    const updatedDrawings = existingDrawings.filter(d => d.id !== drawingToSave.id);
    updatedDrawings.push(drawingToSave);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDrawings));
    console.log('Drawing saved successfully');
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('drawingsUpdated'));
  } catch (error) {
    console.error('Error saving drawing:', error);
  }
}

export function getSavedDrawings(): DrawingData[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const drawings = saved ? JSON.parse(saved) : [];
    console.log(`Loaded ${drawings.length} drawings`);
    return drawings;
  } catch (error) {
    console.error('Error loading drawings:', error);
    return [];
  }
}

export function deleteDrawing(drawingId: string): void {
  try {
    const existingDrawings = getSavedDrawings();
    const updatedDrawings = existingDrawings.filter(d => d.id !== drawingId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDrawings));
    console.log('Drawing deleted successfully');
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('drawingsUpdated'));
  } catch (error) {
    console.error('Error deleting drawing:', error);
  }
}
