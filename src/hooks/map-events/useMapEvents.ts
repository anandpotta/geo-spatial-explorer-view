
import L from 'leaflet';
import { useMapFlyEvents } from './useMapFlyEvents';

/**
 * Main hook to manage all map events
 */
export function useMapEvents(map: L.Map | null, selectedLocation?: { x: number; y: number }) {
  // Use the fly events hook to handle location changes
  useMapFlyEvents(map, selectedLocation);
  
  // Return an empty object as this is mainly a composition hook
  return {};
}
