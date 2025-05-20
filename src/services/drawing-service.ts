
import { DrawingData } from '@/utils/drawing-utils';

export const getSavedDrawings = (): DrawingData[] => {
  try {
    const savedDrawingsJSON = localStorage.getItem('drawings');
    if (savedDrawingsJSON) {
      return JSON.parse(savedDrawingsJSON);
    }
  } catch (error) {
    console.error('Error retrieving saved drawings:', error);
  }
  return [];
};

export const saveDrawing = (drawing: DrawingData): boolean => {
  try {
    const savedDrawings = getSavedDrawings();
    
    // Check if drawing already exists
    const index = savedDrawings.findIndex(d => d.id === drawing.id);
    
    if (index !== -1) {
      // Update existing drawing
      savedDrawings[index] = {
        ...savedDrawings[index],
        ...drawing,
      };
    } else {
      // Add new drawing
      savedDrawings.push(drawing);
    }
    
    // Save to localStorage
    localStorage.setItem('drawings', JSON.stringify(savedDrawings));
    return true;
  } catch (error) {
    console.error('Error saving drawing:', error);
    return false;
  }
};

export const deleteDrawing = (drawingId: string): boolean => {
  try {
    const savedDrawings = getSavedDrawings();
    const updatedDrawings = savedDrawings.filter(d => d.id !== drawingId);
    
    // Save to localStorage
    localStorage.setItem('drawings', JSON.stringify(updatedDrawings));
    return true;
  } catch (error) {
    console.error('Error deleting drawing:', error);
    return false;
  }
};
