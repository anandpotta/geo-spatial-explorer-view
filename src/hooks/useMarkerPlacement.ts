
import { toast } from 'sonner';
import L from 'leaflet';

export function useMarkerPlacement(mapState: any) {
  const handleMapClick = (latlng: L.LatLng) => {
    if (mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) {
      const exactPosition: [number, number] = [latlng.lat, latlng.lng];
      
      console.log('Setting temporary marker at position:', exactPosition);
      
      // Immediately and aggressively set these flags to prevent ANY map navigation
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
      
      // Store position in localStorage as backup
      try {
        localStorage.setItem('tempMarkerPosition', JSON.stringify(exactPosition));
        localStorage.setItem('tempMarkerName', mapState.selectedLocation?.label || 'New Building');
      } catch (error) {
        console.error('Failed to store marker in localStorage:', error);
      }
      
      // Clear any existing temporary marker first
      mapState.setTempMarker(null);
      
      // Use a short timeout to ensure the state update completes
      setTimeout(() => {
        if (!mapState.tempMarker) {
          // Set marker with force flag
          mapState.setTempMarker(exactPosition);
          mapState.setMarkerName(mapState.selectedLocation?.label || 'New Building');
          
          // Re-apply flags after state updates
          window.tempMarkerPlaced = true;
          window.userHasInteracted = true;
          
          toast.info('Click "Save Location" to confirm marker placement', {
            duration: 5000, // Longer duration for better visibility
          });
        }
      }, 50);
    }
  };

  return handleMapClick;
}
