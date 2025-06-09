
import { DrawingData } from './types';
import { toast } from 'sonner';

const STORAGE_KEY = 'savedDrawings';

// Debounce mechanism to prevent rapid event dispatching
let lastEventDispatch = 0;
const EVENT_DEBOUNCE_MS = 200;

const dispatchEventsDebounced = () => {
  const now = Date.now();
  if (now - lastEventDispatch < EVENT_DEBOUNCE_MS) return;
  lastEventDispatch = now;
  
  // Use setTimeout to prevent immediate cascading
  setTimeout(() => {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('drawingsUpdated'));
  }, 50);
};

export const saveDrawing = (drawing: DrawingData): boolean => {
  try {
    console.log('Saving drawing:', drawing.id);
    
    const existingDrawings = getSavedDrawings();
    
    // Check if drawing already exists
    const existingIndex = existingDrawings.findIndex(d => d.id === drawing.id);
    
    if (existingIndex >= 0) {
      // Update existing drawing
      existingDrawings[existingIndex] = drawing;
    } else {
      // Add new drawing
      existingDrawings.push(drawing);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingDrawings));
    
    // Dispatch events with debouncing
    dispatchEventsDebounced();
    
    toast.success('Drawing saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving drawing:', error);
    toast.error('Failed to save drawing');
    return false;
  }
};

export const getSavedDrawings = (): DrawingData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const drawings = JSON.parse(stored);
    return Array.isArray(drawings) ? drawings : [];
  } catch (error) {
    console.error('Error loading drawings:', error);
    return [];
  }
};

export const deleteDrawing = (drawingId: string): boolean => {
  try {
    const existingDrawings = getSavedDrawings();
    const filteredDrawings = existingDrawings.filter(d => d.id !== drawingId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDrawings));
    
    // Dispatch events with debouncing
    dispatchEventsDebounced();
    
    toast.success('Drawing deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting drawing:', error);
    toast.error('Failed to delete drawing');
    return false;
  }
};
