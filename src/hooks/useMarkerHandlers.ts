
import { toast } from 'sonner';
import { DrawingData, saveDrawing } from '@/utils/drawing-utils';
import L from 'leaflet';

export function useMarkerHandlers(mapState: any) {
  const handleMapClick = (latlng: L.LatLng) => {
    if (mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) {
      const exactPosition: [number, number] = [latlng.lat, latlng.lng];
      mapState.setTempMarker(exactPosition);
      mapState.setMarkerName(mapState.selectedLocation?.label || 'New Building');
    }
  };

  const handleShapeCreated = (shape: any) => {
    if (shape.type === 'marker') {
      // Ensure we get the precise coordinates
      const exactPosition: [number, number] = [
        shape.position[0],
        shape.position[1]
      ];
      mapState.setTempMarker(exactPosition);
      mapState.setMarkerName('New Marker');
    } else {
      mapState.setCurrentDrawing(shape);
      toast.success(`${shape.type} created - Click to tag this building`);
    }
  };

  return {
    handleMapClick,
    handleShapeCreated
  };
}
