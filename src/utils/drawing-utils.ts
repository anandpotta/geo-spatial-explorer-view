
export interface DrawingData {
  id: string;
  type: 'polygon' | 'circle' | 'freehand';
  coordinates: Array<[number, number]>;
  properties: {
    name?: string;
    description?: string;
    createdAt: Date;
  };
}

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
  
  // Sync deletion with backend
  deleteDrawingFromBackend(id);
}

async function syncDrawingsWithBackend(drawings: DrawingData[]): Promise<void> {
  try {
    const response = await fetch('/api/drawings/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(drawings),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync drawings with backend');
    }
    
    console.log('Drawings successfully synced with backend');
  } catch (error) {
    console.error('Error syncing drawings with backend:', error);
  }
}

async function fetchDrawingsFromBackend(): Promise<void> {
  try {
    const response = await fetch('/api/drawings');
    
    if (!response.ok) {
      throw new Error('Failed to fetch drawings from backend');
    }
    
    const drawings = await response.json();
    localStorage.setItem('savedDrawings', JSON.stringify(drawings));
    console.log('Drawings successfully fetched from backend');
  } catch (error) {
    console.error('Error fetching drawings from backend:', error);
  }
}

async function deleteDrawingFromBackend(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/drawings/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete drawing from backend');
    }
    
    console.log('Drawing successfully deleted from backend');
  } catch (error) {
    console.error('Error deleting drawing from backend:', error);
  }
}
