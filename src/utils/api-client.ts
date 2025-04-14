
import { LocationMarker, DrawingData } from './geo-utils';

// API base URL - change this to your backend URL when deployed
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com/api' 
  : 'http://localhost:3001/api';

// Network status checker
let isOnline = navigator.onLine;
window.addEventListener('online', () => {
  isOnline = true;
  syncLocalDataWithBackend();
});
window.addEventListener('offline', () => {
  isOnline = false;
});

// Function to sync all local data with backend when coming online
export async function syncLocalDataWithBackend(): Promise<void> {
  if (!isOnline) return;
  
  try {
    // Get all local data
    const markersJson = localStorage.getItem('savedMarkers');
    const drawingsJson = localStorage.getItem('savedDrawings');
    
    // Sync markers
    if (markersJson) {
      const markers = JSON.parse(markersJson);
      await fetch(`${API_BASE_URL}/markers/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(markers),
      });
    }
    
    // Sync drawings
    if (drawingsJson) {
      const drawings = JSON.parse(drawingsJson);
      await fetch(`${API_BASE_URL}/drawings/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(drawings),
      });
    }
    
    console.log('All local data synced with backend');
  } catch (error) {
    console.error('Error syncing local data with backend:', error);
  }
}

// Markers API
export async function fetchMarkers(): Promise<LocationMarker[]> {
  if (!isOnline) {
    const markersJson = localStorage.getItem('savedMarkers');
    return markersJson ? JSON.parse(markersJson) : [];
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/markers`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch markers');
    }
    
    const markers = await response.json();
    // Update local storage with latest data from server
    localStorage.setItem('savedMarkers', JSON.stringify(markers));
    return markers;
  } catch (error) {
    console.error('Error fetching markers:', error);
    // Fall back to local storage
    const markersJson = localStorage.getItem('savedMarkers');
    return markersJson ? JSON.parse(markersJson) : [];
  }
}

export async function createMarker(marker: LocationMarker): Promise<LocationMarker> {
  // Always save to local storage first
  const markers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
  markers.push(marker);
  localStorage.setItem('savedMarkers', JSON.stringify(markers));
  
  // Then try to sync with backend if online
  if (isOnline) {
    try {
      const response = await fetch(`${API_BASE_URL}/markers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(marker),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create marker on server');
      }
      
      const serverMarker = await response.json();
      return serverMarker;
    } catch (error) {
      console.error('Error creating marker on server:', error);
    }
  }
  
  return marker;
}

export async function deleteMarkerApi(id: string): Promise<void> {
  // Always delete from local storage first
  const markers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
  const filteredMarkers = markers.filter((m: LocationMarker) => m.id !== id);
  localStorage.setItem('savedMarkers', JSON.stringify(filteredMarkers));
  
  // Then try to sync with backend if online
  if (isOnline) {
    try {
      const response = await fetch(`${API_BASE_URL}/markers/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete marker on server');
      }
    } catch (error) {
      console.error('Error deleting marker on server:', error);
    }
  }
}

// Drawings API
export async function fetchDrawings(): Promise<DrawingData[]> {
  if (!isOnline) {
    const drawingsJson = localStorage.getItem('savedDrawings');
    return drawingsJson ? JSON.parse(drawingsJson) : [];
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/drawings`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch drawings');
    }
    
    const drawings = await response.json();
    // Update local storage with latest data from server
    localStorage.setItem('savedDrawings', JSON.stringify(drawings));
    return drawings;
  } catch (error) {
    console.error('Error fetching drawings:', error);
    // Fall back to local storage
    const drawingsJson = localStorage.getItem('savedDrawings');
    return drawingsJson ? JSON.parse(drawingsJson) : [];
  }
}

export async function createDrawing(drawing: DrawingData): Promise<DrawingData> {
  // Always save to local storage first
  const drawings = JSON.parse(localStorage.getItem('savedDrawings') || '[]');
  drawings.push(drawing);
  localStorage.setItem('savedDrawings', JSON.stringify(drawings));
  
  // Then try to sync with backend if online
  if (isOnline) {
    try {
      const response = await fetch(`${API_BASE_URL}/drawings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(drawing),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create drawing on server');
      }
      
      const serverDrawing = await response.json();
      return serverDrawing;
    } catch (error) {
      console.error('Error creating drawing on server:', error);
    }
  }
  
  return drawing;
}

export async function deleteDrawingApi(id: string): Promise<void> {
  // Always delete from local storage first
  const drawings = JSON.parse(localStorage.getItem('savedDrawings') || '[]');
  const filteredDrawings = drawings.filter((d: DrawingData) => d.id !== id);
  localStorage.setItem('savedDrawings', JSON.stringify(filteredDrawings));
  
  // Then try to sync with backend if online
  if (isOnline) {
    try {
      const response = await fetch(`${API_BASE_URL}/drawings/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete drawing on server');
      }
    } catch (error) {
      console.error('Error deleting drawing on server:', error);
    }
  }
}
