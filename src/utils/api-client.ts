import { LocationMarker, DrawingData } from './geo-utils';
import { toast } from '@/components/ui/use-toast';

// API base URL - change this to your backend URL when deployed
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com/api' 
  : 'http://localhost:3001/api';

// Network status checker
let isOnline = navigator.onLine;
let isBackendAvailable = false;

// Check if backend is available
async function checkBackendAvailability() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    
    if (response.ok) {
      console.log('Backend API is available');
      isBackendAvailable = true;
      return true;
    } else {
      console.warn('Backend API returned non-200 status:', response.status);
      isBackendAvailable = false;
      return false;
    }
  } catch (error) {
    console.warn('Backend API is not available:', error);
    isBackendAvailable = false;
    return false;
  }
}

// Initialize backend check
checkBackendAvailability().then(available => {
  if (!available) {
    console.log('Working in offline mode - backend not available');
    toast({
      title: "Backend unavailable",
      description: "Working in offline mode. Your data will be stored locally.",
    });
  }
});

// Event listeners for online/offline status
window.addEventListener('online', async () => {
  isOnline = true;
  const backendAvailable = await checkBackendAvailability();
  if (backendAvailable) {
    syncLocalDataWithBackend();
    toast({
      title: "Back online",
      description: "Syncing data with server...",
    });
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  toast({
    title: "Working offline",
    description: "Your data will be stored locally until you reconnect.",
  });
});

// Function to sync all local data with backend when coming online
export async function syncLocalDataWithBackend(): Promise<void> {
  if (!isOnline || !isBackendAvailable) return;
  
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
  // Always check local storage first
  const markersJson = localStorage.getItem('savedMarkers');
  const localMarkers = markersJson ? JSON.parse(markersJson) : [];
  
  // If offline or backend not available, return local data
  if (!isOnline || !isBackendAvailable) {
    return localMarkers;
  }
  
  // Try to fetch from backend
  try {
    const response = await fetch(`${API_BASE_URL}/markers`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch markers: ${response.status}`);
    }
    
    // Check if we received HTML instead of JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') === -1) {
      console.error('Received non-JSON response from API:', contentType);
      return localMarkers;
    }
    
    const markers = await response.json();
    // Update local storage with latest data from server
    localStorage.setItem('savedMarkers', JSON.stringify(markers));
    return markers;
  } catch (error) {
    console.error('Error fetching markers:', error);
    // Fall back to local storage
    return localMarkers;
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
