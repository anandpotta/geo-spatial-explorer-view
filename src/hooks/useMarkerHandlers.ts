
import { toast } from 'sonner';
import { DrawingData, saveDrawing } from '@/utils/drawing-utils';
import L from 'leaflet';
import { useAuth } from '@/contexts/AuthContext';

export function useMarkerHandlers(mapState: any) {
  const { currentUser } = useAuth();
  
  const handleMapClick = (latlng: L.LatLng) => {
    console.log('Map clicked at:', latlng.lat, latlng.lng, 'Active tool:', mapState.activeTool);
    
    // Only create markers when explicitly in marker mode or no tool is active
    if (mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) {
      const exactPosition: [number, number] = [latlng.lat, latlng.lng];
      
      console.log('Creating temp marker at position:', exactPosition);
      
      // Clear any existing temp marker first
      mapState.setTempMarker(null);
      
      // Set the new temp marker with a small delay to ensure proper state update
      setTimeout(() => {
        mapState.setTempMarker(exactPosition);
        
        // Always set a default name to make it easier to save
        const defaultName = mapState.selectedLocation?.label || 'New Location';
        mapState.setMarkerName(defaultName);
        
        console.log('Temp marker state set with name:', defaultName);
      }, 50);
    }
  };

  const handleShapeCreated = (shape: any) => {
    console.log('handleShapeCreated called with shape type:', shape.type);
    
    // Check if this is specifically a marker creation event
    if (shape.type === 'marker') {
      console.log('Processing marker creation with position:', shape.position);
      
      // Remove the actual marker from the map since we want to show it as temp marker
      if (shape.layer && shape.layer.remove) {
        shape.layer.remove();
      }
      
      let exactPosition: [number, number] | null = null;
      
      // Try to get position from shape.position first
      if (shape.position && Array.isArray(shape.position) && shape.position.length >= 2) {
        exactPosition = [shape.position[0], shape.position[1]];
      } 
      // Fall back to getting position from the layer
      else if (shape.layer && shape.layer.getLatLng) {
        const latLng = shape.layer.getLatLng();
        exactPosition = [latLng.lat, latLng.lng];
      }
      
      if (exactPosition) {
        console.log('Setting temp marker from shape creation at:', exactPosition);
        
        // Clear any existing temporary marker first
        mapState.setTempMarker(null);
        
        // Force a state update to ensure the temp marker appears
        setTimeout(() => {
          mapState.setTempMarker(exactPosition);
          mapState.setMarkerName('New Location');
          console.log('Temp marker state set from shape - popup should appear');
          
          // Force the marker to be processed by triggering a re-render
          setTimeout(() => {
            console.log('Final temp marker confirmation:', exactPosition);
          }, 100);
        }, 50);
        
      } else {
        console.error('Could not determine marker position from shape:', shape);
        toast.error('Could not create marker: invalid position data');
      }
      
    } else if (shape.type === 'circle' || shape.type === 'rectangle' || shape.type === 'polygon') {
      // Handle drawing shapes (circles, rectangles, polygons) - ABSOLUTELY NO MARKER LOGIC
      console.log(`Creating ${shape.type} shape - no marker creation`);
      
      // Create a safe copy of the shape without potential circular references
      const safeShape: DrawingData = {
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
        properties: shape.properties || {
          name: `New ${shape.type}`,
          color: '#3388ff',
          createdAt: new Date()
        },
        userId: currentUser?.id || '' // Add the user ID
      };
      
      // Store the safe shape in the current drawing
      mapState.setCurrentDrawing(safeShape);
      
      // Also immediately save the drawing to prevent loss
      saveDrawing(safeShape);
      
      toast.success(`${shape.type} created successfully`);
      
    } else {
      console.log(`Unknown shape type: ${shape.type}`);
    }
  };

  return {
    handleMapClick,
    handleShapeCreated
  };
}
