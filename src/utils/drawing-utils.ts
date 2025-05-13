
// Re-export all drawing types and functions
export type { DrawingData } from './drawings/types';
export { 
  saveDrawing, 
  getSavedDrawings, 
  deleteDrawing,
  createDrawing,
  syncDrawingsWithBackend,
  fetchDrawingsFromBackend,
  deleteDrawingFromBackend
} from './drawings/index';
