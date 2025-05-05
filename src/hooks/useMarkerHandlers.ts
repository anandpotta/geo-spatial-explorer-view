
import { toast } from 'sonner';
import { DrawingData } from '@/utils/drawing-utils';
import L from 'leaflet';

export function useMarkerHandlers(mapState: any) {
  const handleMapClick = (latlng: L.LatLng) => {
    // Only set temp marker if in marker tool mode OR no active tool and no current temp marker
    if (mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) {
      // Clear any existing temp marker first to prevent duplicates
      if (mapState.tempMarker) {
        mapState.setTempMarker(null);
        // Give React time to unmount the previous marker
        setTimeout(() => {
          const exactPosition: [number, number] = [latlng.lat, latlng.lng];
          mapState.setTempMarker(exactPosition);
          
          // Set a default name
          const defaultName = mapState.selectedLocation?.label || 'New Building';
          mapState.setMarkerName(defaultName);
        }, 10);
      } else {
        // No existing temp marker, set one directly
        const exactPosition: [number, number] = [latlng.lat, latlng.lng];
        mapState.setTempMarker(exactPosition);
        
        // Set a default name
        const defaultName = mapState.selectedLocation?.label || 'New Building';
        mapState.setMarkerName(defaultName);
      }
    }
  };

  const handleShapeCreated = (shape: any) => {
    if (shape.type === 'marker') {
      // First clear any existing temp marker
      mapState.setTempMarker(null);
      
      // Brief delay to ensure previous marker is unmounted
      setTimeout(() => {
        // Ensure we get the precise coordinates
        const exactPosition: [number, number] = [
          shape.position[0],
          shape.position[1]
        ];
        mapState.setTempMarker(exactPosition);
        mapState.setMarkerName('New Marker');
      }, 10);
    } else {
      // Create a safe copy of the shape without potential circular references
      const safeShape = {
        type: shape.type,
        id: shape.id,
        coordinates: shape.coordinates || [],
        // If geoJSON exists, create a clean copy
        geoJSON: shape.geoJSON ? {
          type: shape.geoJSON.type,
          geometry: shape.geoJSON.geometry,
          properties: shape.geoJSON.properties || {}
        } : undefined,
        options: shape.options || {},
        properties: shape.properties || {
          name: `New ${shape.type}`,
          color: '#3388ff',
          createdAt: new Date()
        }
      };
      
      mapState.setCurrentDrawing(safeShape);
      toast.success(`${shape.type} created - Click to tag this building`);
    }
  };

  return {
    handleMapClick,
    handleShapeCreated
  };
}
