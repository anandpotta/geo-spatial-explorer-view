
import { v4 as uuidv4 } from 'uuid';
import { ImageTransformOptions, getDefaultTransformOptions } from './image-transform-utils';

export interface DrawingProperties {
  name?: string;
  type?: string;
  color?: string;
  associatedMarkerId?: string;
  [key: string]: any;
}

export interface DrawingData {
  id: string;
  type: string;
  coordinates: Array<[number, number]>;
  properties: DrawingProperties;
  geoJSON?: any;
  svgPath?: string;
  imageData?: string;
  imageTransform?: ImageTransformOptions;
  createdAt: Date;
}

// Function to save a drawing to localStorage
export const saveDrawing = (drawing: DrawingData): void => {
  try {
    const drawings = getSavedDrawings();
    
    // Check if drawing already exists
    const existingIndex = drawings.findIndex(d => d.id === drawing.id);
    
    if (existingIndex >= 0) {
      // Update existing drawing
      drawings[existingIndex] = {
        ...drawings[existingIndex],
        ...drawing,
        // Preserve image data if not provided in the update
        imageData: drawing.imageData || drawings[existingIndex].imageData,
        imageTransform: drawing.imageTransform || drawings[existingIndex].imageTransform
      };
    } else {
      // Add new drawing
      drawings.push(drawing);
    }
    
    localStorage.setItem('savedDrawings', JSON.stringify(drawings));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error saving drawing:', err);
  }
};

// Function to get all saved drawings from localStorage
export const getSavedDrawings = (): DrawingData[] => {
  try {
    const drawingsJson = localStorage.getItem('savedDrawings');
    if (!drawingsJson) return [];
    
    const drawings = JSON.parse(drawingsJson);
    return Array.isArray(drawings) ? drawings : [];
  } catch (err) {
    console.error('Error getting saved drawings:', err);
    return [];
  }
};

// Function to delete a drawing from localStorage
export const deleteDrawing = (id: string): void => {
  try {
    const drawings = getSavedDrawings().filter(drawing => drawing.id !== id);
    localStorage.setItem('savedDrawings', JSON.stringify(drawings));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error deleting drawing:', err);
  }
};

// Function to create a new drawing
export const createDrawing = (data: Partial<DrawingData>): DrawingData => {
  return {
    id: data.id || uuidv4(),
    type: data.type || 'polygon',
    coordinates: data.coordinates || [],
    properties: data.properties || { color: '#3388ff' },
    geoJSON: data.geoJSON || undefined,
    svgPath: data.svgPath || undefined,
    createdAt: data.createdAt || new Date()
  };
};

// Function to update a drawing's image data
export const updateDrawingImage = (drawingId: string, imageData: string): void => {
  const drawings = getSavedDrawings();
  const drawing = drawings.find(d => d.id === drawingId);
  
  if (drawing) {
    drawing.imageData = imageData;
    
    // Initialize transform if not already set
    if (!drawing.imageTransform) {
      drawing.imageTransform = getDefaultTransformOptions();
    }
    
    localStorage.setItem('savedDrawings', JSON.stringify(drawings));
    
    // Dispatch events to notify components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('image-updated', { 
      detail: { drawingId, imageData }
    }));
  }
};

// Function to update a drawing's image transform
export const updateDrawingImageTransform = (
  drawingId: string, 
  transformOptions: ImageTransformOptions
): void => {
  const drawings = getSavedDrawings();
  const drawing = drawings.find(d => d.id === drawingId);
  
  if (drawing) {
    drawing.imageTransform = transformOptions;
    localStorage.setItem('savedDrawings', JSON.stringify(drawings));
    
    // Dispatch events
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('image-transform-updated', { 
      detail: { drawingId, transformOptions }
    }));
  }
};
