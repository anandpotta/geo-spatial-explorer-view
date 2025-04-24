
import { DrawingData } from '@/types/drawing';

let hasBeenCleared = false;
let clearTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function saveToLocalStorage(drawings: DrawingData[]): void {
  try {
    localStorage.setItem('savedDrawings', JSON.stringify(drawings));
    const event = new StorageEvent('storage', {
      key: 'savedDrawings',
      newValue: JSON.stringify(drawings)
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Failed to save to local storage:', error);
  }
}

export function getFromLocalStorage(): DrawingData[] {
  if (hasBeenCleared) {
    console.log('getSavedDrawings: returning empty array due to recent clear');
    return [];
  }
  
  const drawingsJson = localStorage.getItem('savedDrawings');
  if (!drawingsJson) return [];
  
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

export function setClearedState(cleared: boolean, timeout: number = 3000): void {
  hasBeenCleared = cleared;
  if (clearTimeoutId) {
    clearTimeout(clearTimeoutId);
  }
  if (cleared) {
    clearTimeoutId = setTimeout(() => {
      console.log('Resetting hasBeenCleared flag after timeout');
      hasBeenCleared = false;
      clearTimeoutId = null;
    }, timeout);
  }
}

export function isClearedState(): boolean {
  return hasBeenCleared;
}
