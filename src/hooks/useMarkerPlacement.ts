
import { toast } from 'sonner';
import L from 'leaflet';

export function useMarkerPlacement(mapState: any) {
  const handleMapClick = (latlng: L.LatLng) => {
    if (mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) {
      const exactPosition: [number, number] = [latlng.lat, latlng.lng];
      
      console.log('Setting temporary marker at position:', exactPosition);
      
      // Explicitly set these flags BEFORE setting the marker to prevent map navigation
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
      
      // Clear any existing temporary marker first
      mapState.setTempMarker(null);
      
      // Use a short timeout to ensure the state update completes
      setTimeout(() => {
        if (!mapState.tempMarker) {
          mapState.setTempMarker(exactPosition);
          mapState.setMarkerName(mapState.selectedLocation?.label || 'New Building');
          
          toast.info('Click "Save Location" to confirm marker placement', {
            duration: 3000,
          });
        }
      }, 50);
    }
  };

  return handleMapClick;
}
