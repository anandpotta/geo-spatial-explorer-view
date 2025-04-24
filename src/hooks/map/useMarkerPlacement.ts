
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
      
      // Set interaction flags without triggering a refresh
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
      
      // Store position in localStorage with a try/catch to prevent errors
      try {
        localStorage.setItem('tempMarkerPosition', JSON.stringify(exactPosition));
        localStorage.setItem('tempMarkerName', mapState.selectedLocation?.label || 'New Building');
      } catch (error) {
        console.error('Failed to store marker in localStorage:', error);
      }
      
      // Update marker state with the position first, then name
      // Using a small delay to prevent state update issues
      const markerName = mapState.selectedLocation?.label || 'New Building';
      
      // Clear existing marker first if exists
      if (mapState.tempMarker) {
        mapState.setTempMarker(null);
        // Small delay before setting new marker
        setTimeout(() => {
          mapState.setTempMarker(exactPosition);
          setTimeout(() => {
            mapState.setMarkerName(markerName);
          }, 10);
        }, 10);
      } else {
        // Set temp marker directly if no marker exists
        mapState.setTempMarker(exactPosition);
        setTimeout(() => {
          mapState.setMarkerName(markerName);
        }, 10);
      }
      
      // Show toast after a slight delay to ensure marker is visible
      setTimeout(() => {
        toast.info('Click "Save Location" to confirm marker placement', {
          duration: 5000,
          id: 'marker-placement',
        });
      }, 100);
    }
  };

  return handleMapClick;
}
