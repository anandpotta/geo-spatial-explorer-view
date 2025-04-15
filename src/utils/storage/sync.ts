
import { LocationMarker } from '../location/types';
import { DrawingData } from '../drawing/types';
import { getConnectionStatus } from '../api-service';

export async function syncMarkersWithBackend(markers: LocationMarker[]): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) return;
  
  try {
    const response = await fetch('/api/markers/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(markers),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync markers with backend');
    }
    
    console.log('Markers successfully synced with backend');
  } catch (error) {
    console.error('Error syncing markers with backend:', error);
  }
}

export async function fetchMarkersFromBackend(): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) {
    throw new Error('Backend unavailable');
  }
  
  try {
    const response = await fetch('/api/markers');
    
    if (!response.ok) {
      throw new Error('Failed to fetch markers from backend');
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format from backend');
    }
    
    const markers = await response.json();
    localStorage.setItem('savedMarkers', JSON.stringify(markers));
    console.log('Markers successfully fetched from backend');
  } catch (error) {
    console.error('Error fetching markers from backend:', error);
    throw error;
  }
}

export async function deleteMarkerFromBackend(id: string): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) return;
  
  try {
    const response = await fetch(`/api/markers/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete marker from backend');
    }
    
    console.log('Marker successfully deleted from backend');
  } catch (error) {
    console.error('Error deleting marker from backend:', error);
  }
}

export async function syncDrawingsWithBackend(drawings: DrawingData[]): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) return;
  
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

export async function fetchDrawingsFromBackend(): Promise<void> {
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

export async function deleteDrawingFromBackend(id: string): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) return;
  
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
