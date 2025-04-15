
import { DrawingData } from '../drawing/types';
import { getConnectionStatus } from '../api-service';
import { syncDrawingsWithBackend, fetchDrawingsFromBackend } from './sync';

export function saveDrawing(drawing: DrawingData): void {
  const savedDrawings = getSavedDrawings();
  savedDrawings.push(drawing);
  localStorage.setItem('savedDrawings', JSON.stringify(savedDrawings));
  
  // Sync with backend
  syncDrawingsWithBackend(savedDrawings);
}

export function getSavedDrawings(): DrawingData[] {
  const drawingsJson = localStorage.getItem('savedDrawings');
  if (!drawingsJson) {
    // Try to fetch from backend first if localStorage is empty
    fetchDrawingsFromBackend();
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

export function deleteDrawing(id: string): void {
  const savedDrawings = getSavedDrawings();
  const filteredDrawings = savedDrawings.filter(drawing => drawing.id !== id);
  localStorage.setItem('savedDrawings', JSON.stringify(filteredDrawings));
  
  // Sync deletion with backend using the syncDrawingsWithBackend function
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (isOnline && isBackendAvailable) {
    // Pass the updated list of drawings to sync
    syncDrawingsWithBackend(filteredDrawings);
  }
}
