
// This file is maintained for backward compatibility
// All functionality has been moved to the drawings/ directory

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
