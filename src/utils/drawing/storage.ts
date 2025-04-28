
import { DrawingData } from './types';

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

export function saveToLocalStorage(drawings: DrawingData[]): void {
  localStorage.setItem('savedDrawings', JSON.stringify(drawings));
  window.dispatchEvent(new Event('storage'));
}
