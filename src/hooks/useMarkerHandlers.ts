
import { toast } from 'sonner';
import { DrawingData, saveDrawing } from '@/utils/drawing-utils';
import L from 'leaflet';

export function useMarkerHandlers(mapState: any) {
  const handleMapClick = (latlng: L.LatLng) => {
    // This is the key fix: We need to check if activeTool is marker OR if no tool is active and we're not already placing a marker
    if (mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) {
      const exactPosition: [number, number] = [latlng.lat, latlng.lng];
      
      console.log('Setting temporary marker at position:', exactPosition);
      
      // Clear any existing temporary marker before setting a new one
      mapState.setTempMarker(null);
      
      // Short delay to ensure the previous marker is cleared first
      setTimeout(() => {
        // Double-check we don't already have a marker in progress
        if (!mapState.tempMarker) {
          // Stop automatic map navigation
          if (window.tempMarkerPlaced) {
            window.tempMarkerPlaced = true;
          }
          
          mapState.setTempMarker(exactPosition);
          mapState.setMarkerName(mapState.selectedLocation?.label || 'New Building');
          
          // Show a toast to indicate marker can be saved
          toast.info('Click "Save Location" to confirm marker placement', {
            duration: 3000,
          });
        }
      }, 10);
    }
  };

  const handleShapeCreated = (shape: any) => {
    if (shape.type === 'marker') {
      // Ensure we don't already have a temporary marker active
      if (mapState.tempMarker) {
        console.log('Ignoring marker creation, temporary marker already exists');
        return;
      }
      
      // Ensure we get the precise coordinates
      const exactPosition: [number, number] = [
        shape.position[0],
        shape.position[1]
      ];
      
      console.log('Created marker shape at:', exactPosition);
      
      // Track that a marker has been placed manually
      if (window.tempMarkerPlaced !== undefined) {
        window.tempMarkerPlaced = true;
      }
      
      mapState.setTempMarker(exactPosition);
      mapState.setMarkerName('New Marker');
      
      // Show a toast to guide the user
      toast.info('Enter a name and click "Save Location"', {
        duration: 3000,
      });
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

// Add global tracking for marker placement
declare global {
  interface Window {
    tempMarkerPlaced?: boolean;
    tempMarkerPositionUpdate?: (pos: [number, number] | null) => void;
  }
}
