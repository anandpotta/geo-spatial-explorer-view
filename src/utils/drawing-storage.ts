
import { DrawingData } from './drawing-types';

/**
 * Get all drawings from local storage
 */
export function getSavedDrawings(): DrawingData[] {
  const drawingsJson = localStorage.getItem('savedDrawings');
  if (!drawingsJson) {
    return [];
  }
  
  try {
    const drawings = JSON.parse(drawingsJson);
    return drawings.map((drawing: any) => ({
      ...drawing,
      properties: {
        ...drawing.properties,
        createdAt: new Date(drawing.properties.createdAt)
      }
    }));
  } catch (e) {
    console.error('Failed to parse saved drawings', e);
    return [];
  }
}

/**
 * Save drawings to local storage
 */
export function saveDrawingsToStorage(drawings: DrawingData[]): void {
  localStorage.setItem('savedDrawings', JSON.stringify(drawings));
  
  // Notify components about storage changes
  window.dispatchEvent(new Event('storage'));
}
