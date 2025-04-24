
import { toast } from 'sonner';
import L from 'leaflet';

export function useMarkerPlacement(mapState: any) {
  // Debounce function to prevent multiple rapid clicks
  let clickTimeout: number | null = null;
  
  const handleMapClick = (latlng: L.LatLng) => {
    // Prevent multiple clicks in quick succession
    if (clickTimeout) {
      window.clearTimeout(clickTimeout);
    }
    
    clickTimeout = window.setTimeout(() => {
      // Only proceed if the marker tool is active or we don't have a temporary marker yet
      if (mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) {
        const exactPosition: [number, number] = [latlng.lat, latlng.lng];
        
        console.log('Setting temporary marker at position:', exactPosition);
        
        // Immediately set these flags to prevent ANY map navigation
        window.tempMarkerPlaced = true;
        window.userHasInteracted = true;
        
        // Clear any existing temporary marker first to prevent state conflicts
        if (mapState.tempMarker) {
          mapState.setTempMarker(null);
        }
        
        // Store position in localStorage as backup
        try {
          localStorage.setItem('tempMarkerPosition', JSON.stringify(exactPosition));
          localStorage.setItem('tempMarkerName', mapState.selectedLocation?.label || 'New Building');
        } catch (error) {
          console.error('Failed to store marker in localStorage:', error);
        }
        
        // Set the marker with a slight delay to ensure state stability
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
      }
      
      // Return false to prevent any further processing of the click event
      return false;
    }, 100);
  };

  return handleMapClick;
}
