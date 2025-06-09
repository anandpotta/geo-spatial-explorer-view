
import { LocationMarker } from './types';

export async function syncMarkersWithBackend(markers: LocationMarker[]): Promise<void> {
  // Placeholder implementation
  console.log('Syncing markers with backend:', markers);
}

export async function fetchMarkersFromBackend(): Promise<LocationMarker[]> {
  // Placeholder implementation
  console.log('Fetching markers from backend');
  return [];
}

export async function deleteMarkerFromBackend(id: string): Promise<void> {
  // Placeholder implementation
  console.log('Deleting marker from backend:', id);
}
