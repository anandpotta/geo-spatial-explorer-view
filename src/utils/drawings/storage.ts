
import { DrawingData } from './types';
import { toast } from 'sonner';

const STORAGE_KEY = 'savedDrawings';

// More aggressive debouncing to prevent infinite loops
let lastEventDispatch = 0;
const EVENT_DEBOUNCE_MS = 1000; // Increased from 200ms to 1000ms
let pendingEventTimeout: NodeJS.Timeout | null = null;

const dispatchEventsDebounced = () => {
  const now = Date.now();
  if (now - lastEventDispatch < EVENT_DEBOUNCE_MS) {
    console.log('Event dispatch debounced to prevent loops');
    return;
  }
  
  // Clear any pending events to prevent stacking
  if (pendingEventTimeout) {
    clearTimeout(pendingEventTimeout);
  }
  
  lastEventDispatch = now;
  
  // Use longer timeout to prevent cascading
  pendingEventTimeout = setTimeout(() => {
    console.log('Dispatching storage events');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    pendingEventTimeout = null;
  }, 300); // Increased delay
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
    
    // Dispatch events with aggressive debouncing
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
    
    // Dispatch events with aggressive debouncing
    dispatchEventsDebounced();
    
    toast.success('Drawing deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting drawing:', error);
    toast.error('Failed to delete drawing');
    return false;
  }
};
