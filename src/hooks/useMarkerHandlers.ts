
import { toast } from 'sonner';
import { DrawingData, saveDrawing } from '@/utils/drawing-utils';
import L from 'leaflet';
import { getSvgPathFromLayer } from '@/utils/leaflet-drawing-config';

export function useMarkerHandlers(mapState: any) {
  const handleMapClick = (latlng: L.LatLng) => {
    if (mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) {
      const exactPosition: [number, number] = [latlng.lat, latlng.lng];
      mapState.setTempMarker(exactPosition);
      
      // Always set a default name to make it easier to save
      const defaultName = mapState.selectedLocation?.label || 'New Building';
      mapState.setMarkerName(defaultName);
      
      // Make sure to focus on the marker name input field after a short delay
      setTimeout(() => {
        const inputField = document.querySelector('.leaflet-popup input');
        if (inputField) {
          (inputField as HTMLElement).focus();
        }
      }, 100);
    }
  };

  const handleShapeCreated = (shape: any) => {
    if (shape.type === 'marker') {
      // Ensure position exists and is valid before accessing it
      if (shape.position && Array.isArray(shape.position) && shape.position.length >= 2) {
        const exactPosition: [number, number] = [
          shape.position[0],
          shape.position[1]
        ];
        mapState.setTempMarker(exactPosition);
        mapState.setMarkerName('New Marker');
        
        // Focus on the marker name input field after a short delay
        setTimeout(() => {
          const inputField = document.querySelector('.leaflet-popup input');
          if (inputField) {
            (inputField as HTMLElement).focus();
          }
        }, 100);
      } else if (shape.layer && shape.layer.getLatLng) {
        // Alternative: try to get position from the layer if available
        const latLng = shape.layer.getLatLng();
        mapState.setTempMarker([latLng.lat, latLng.lng]);
        mapState.setMarkerName('New Marker');
        
        // Focus on the marker name input field after a short delay
        setTimeout(() => {
          const inputField = document.querySelector('.leaflet-popup input');
          if (inputField) {
            (inputField as HTMLElement).focus();
          }
        }, 100);
      } else {
        console.error('Invalid marker position data:', shape);
        toast.error('Could not create marker: invalid position data');
        return;
      }
    } else {
      // Create a safe copy of the shape without potential circular references
      const safeShape = {
        type: shape.type,
        id: shape.id || crypto.randomUUID(), // Ensure there's always an ID
        coordinates: shape.coordinates || [],
        // If geoJSON exists, create a clean copy
        geoJSON: shape.geoJSON ? {
          type: shape.geoJSON.type,
          geometry: shape.geoJSON.geometry,
          properties: shape.geoJSON.properties || {}
        } : shape.layer ? {
          type: "Feature",
          geometry: shape.layer.toGeoJSON().geometry,
          properties: {}
        } : undefined,
        options: shape.options || {},
        // Include SVG path data if available
        svgPath: shape.svgPath,
        properties: shape.properties || {
          name: `New ${shape.type}`,
          color: '#3388ff',
          createdAt: new Date()
        }
      };
      
      // Log the path data for debugging
      if (shape.svgPath) {
        console.log(`Saved shape path: ${shape.svgPath}`);
      } else if (shape.layer) {
        // Try to generate path from layer if not provided
        try {
          const svgPath = getSvgPathFromLayer(shape.layer, shape.type);
          safeShape.svgPath = svgPath;
          console.log(`Generated path from layer: ${svgPath}`);
        } catch (err) {
          console.warn('Could not generate SVG path from layer:', err);
        }
      }
      
      // Store the safe shape in the current drawing
      mapState.setCurrentDrawing(safeShape);
      
      // Also immediately save the drawing to prevent loss
      saveDrawing(safeShape);
      
      toast.success(`${shape.type} created - Click to tag this building or upload a file`);
    }
  };

  return {
    handleMapClick,
    handleShapeCreated
  };
}
