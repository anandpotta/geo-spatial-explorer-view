
import { toast } from 'sonner';
import L from 'leaflet';

export function useMarkerPlacement(mapState: any) {
  const handleMapClick = (latlng: L.LatLng) => {
    if (mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) {
      const exactPosition: [number, number] = [latlng.lat, latlng.lng];
      
      console.log('Setting temporary marker at position:', exactPosition);
      
      mapState.setTempMarker(null);
      
      setTimeout(() => {
        if (!mapState.tempMarker) {
          window.tempMarkerPlaced = true;
          window.userHasInteracted = true;
          
          mapState.setTempMarker(exactPosition);
          mapState.setMarkerName(mapState.selectedLocation?.label || 'New Building');
          
          toast.info('Click "Save Location" to confirm marker placement', {
            duration: 3000,
          });
        }
      }, 10);
    }
  };

  return handleMapClick;
}

