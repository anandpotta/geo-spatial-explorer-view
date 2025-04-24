
import { toast } from 'sonner';

export function useShapeCreation(mapState: any) {
  const handleShapeCreated = (shape: any) => {
    if (shape.type === 'marker') {
      if (mapState.tempMarker) {
        console.log('Ignoring marker creation, temporary marker already exists');
        return;
      }
      
      const exactPosition: [number, number] = [
        shape.position[0],
        shape.position[1]
      ];
      
      console.log('Created marker shape at:', exactPosition);
      
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
      
      mapState.setTempMarker(exactPosition);
      mapState.setMarkerName('New Marker');
      
      toast.info('Enter a name and click "Save Location"', {
        duration: 3000,
      });
    } else {
      const safeShape = {
        type: shape.type,
        id: shape.id,
        coordinates: shape.coordinates || [],
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

  return handleShapeCreated;
}

// Add global tracking for marker placement and user interaction
declare global {
  interface Window {
    tempMarkerPlaced?: boolean;
    userHasInteracted?: boolean;
    tempMarkerPositionUpdate?: (pos: [number, number] | null) => void;
  }
}

