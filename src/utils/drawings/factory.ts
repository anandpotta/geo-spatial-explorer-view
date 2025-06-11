
import { DrawingData } from './types';
import { getCurrentUser } from '../../services/auth-service';
import { v4 as uuidv4 } from 'uuid';
import { saveDrawing } from './storage';

/**
 * Create a new drawing with default values
 */
export function createDrawing(drawingData: Partial<DrawingData>): DrawingData {
  const currentUser = getCurrentUser();
  
  const drawing: DrawingData = {
    id: drawingData.id || uuidv4(),
    type: drawingData.type || 'polygon',
    coordinates: drawingData.coordinates || [],
    geoJSON: drawingData.geoJSON,
    options: drawingData.options,
    svgPath: drawingData.svgPath,
    properties: {
      name: drawingData.properties?.name || 'Unnamed Drawing',
      description: drawingData.properties?.description,
      color: drawingData.properties?.color || '#33C3F0',
      createdAt: drawingData.properties?.createdAt || new Date(),
      associatedMarkerId: drawingData.properties?.associatedMarkerId
    },
    userId: currentUser ? currentUser.id : 'anonymous' // Use 'anonymous' if no user is logged in
  };
  
  saveDrawing(drawing);
  return drawing;
}
