
import { toast } from 'sonner';
import L from 'leaflet';

interface MarkerPlacementState {
  setTempMarker: (position: [number, number] | null) => void;
  setMarkerName: (name: string) => void;
  activeTool: string | null;
  tempMarker: [number, number] | null;
  selectedLocation?: { label: string };
}

export function useMarkerPlacement(mapState: MarkerPlacementState) {
  const handleMapClick = (latlng: L.LatLng) => {
    // Only proceed if marker tool is active or no temporary marker exists
    if (mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) {
      const exactPosition: [number, number] = [latlng.lat, latlng.lng];
      
      // Set flags first
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
      
      // Store position in localStorage with a try/catch to prevent errors
      try {
        localStorage.setItem('tempMarkerPosition', JSON.stringify(exactPosition));
        localStorage.setItem('tempMarkerName', mapState.selectedLocation?.label || 'New Building');
      } catch (error) {
        console.error('Failed to store marker in localStorage:', error);
      }
      
      // Clear existing marker first to prevent state conflicts
      if (mapState.tempMarker) {
        mapState.setTempMarker(null);
      }
      
      // Use a single state update to reduce re-renders
      setTimeout(() => {
        mapState.setTempMarker(exactPosition);
        mapState.setMarkerName(mapState.selectedLocation?.label || 'New Building');
        
        // Re-apply flags after state updates
        window.tempMarkerPlaced = true;
        window.userHasInteracted = true;
        
        toast.info('Click "Save Location" to confirm marker placement', {
          duration: 5000,
          id: 'marker-placement', // Use ID to prevent duplicate toasts
        });
      }, 50);
      
      // Stop propagation and prevent default to improve interaction stability
      return false;
    }
  };

  return handleMapClick;
}
