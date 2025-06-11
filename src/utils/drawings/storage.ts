
import { DrawingData } from './types';
import { toast } from 'sonner';

const STORAGE_KEY = 'savedDrawings';

export function getSavedDrawings(): DrawingData[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    
    const drawings = JSON.parse(saved);
    return Array.isArray(drawings) ? drawings : [];
  } catch (error) {
    console.error('Error loading drawings:', error);
    return [];
  }
}

export function saveDrawing(drawing: DrawingData): boolean {
  try {
    const existingDrawings = getSavedDrawings();
    
    // Set userId to 'anonymous' if not provided (no auth required)
    const drawingToSave = {
      ...drawing,
      userId: drawing.userId || 'anonymous'
    };
    
    // Check if drawing already exists and update it
    const existingIndex = existingDrawings.findIndex(d => d.id === drawing.id);
    
    if (existingIndex >= 0) {
      existingDrawings[existingIndex] = drawingToSave;
    } else {
      existingDrawings.push(drawingToSave);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingDrawings));
    
    // Notify other components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    
    console.log('Drawing saved successfully:', drawing.id);
    return true;
  } catch (error) {
    console.error('Error saving drawing:', error);
    toast.error('Failed to save drawing');
    return false;
  }
}

export function deleteDrawing(id: string): boolean {
  try {
    const existingDrawings = getSavedDrawings();
    const filteredDrawings = existingDrawings.filter(d => d.id !== id);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDrawings));
    
    // Notify other components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    
    toast.success('Drawing deleted');
    return true;
  } catch (error) {
    console.error('Error deleting drawing:', error);
    toast.error('Failed to delete drawing');
    return false;
  }
}
