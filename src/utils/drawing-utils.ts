
// Add the clipImage property to the DrawingData interface
export interface DrawingProperties {
  name: string;
  type: string;
  color: string;
  associatedMarkerId?: string; // Added to support marker association
}

export interface DrawingData {
  id: string;
  properties: DrawingProperties;
  geoJSON: any;
  svgPath?: string; // SVG path data for more precise rendering
  clipImage?: string; // Added for image clipping
  createdAt?: number;
  updatedAt?: number;
}

export const saveDrawing = (drawing: DrawingData): void => {
  try {
    const savedDrawings = getSavedDrawings();
    
    // Check if drawing with same ID exists
    const existingIndex = savedDrawings.findIndex(d => d.id === drawing.id);
    
    if (existingIndex >= 0) {
      // Update existing drawing
      savedDrawings[existingIndex] = drawing;
    } else {
      // Add new drawing
      savedDrawings.push(drawing);
    }
    
    localStorage.setItem('savedDrawings', JSON.stringify(savedDrawings));
    
    // Dispatch an event to notify other components
    window.dispatchEvent(new Event('drawingsUpdated'));
  } catch (error) {
    console.error('Error saving drawing:', error);
  }
};

export const getDrawingById = (drawingId: string): DrawingData | null => {
  try {
    const savedDrawings = getSavedDrawings();
    return savedDrawings.find(d => d.id === drawingId) || null;
  } catch (error) {
    console.error('Error getting drawing:', error);
    return null;
  }
};

export const getSavedDrawings = (): DrawingData[] => {
  try {
    const drawingsJson = localStorage.getItem('savedDrawings');
    
    if (!drawingsJson) {
      return [];
    }
    
    return JSON.parse(drawingsJson);
  } catch (error) {
    console.error('Error getting saved drawings:', error);
    return [];
  }
};

export const deleteDrawing = (drawingId: string): void => {
  try {
    const savedDrawings = getSavedDrawings();
    const filteredDrawings = savedDrawings.filter(d => d.id !== drawingId);
    
    localStorage.setItem('savedDrawings', JSON.stringify(filteredDrawings));
    
    // Dispatch an event to notify other components
    window.dispatchEvent(new Event('drawingsUpdated'));
  } catch (error) {
    console.error('Error deleting drawing:', error);
  }
};
