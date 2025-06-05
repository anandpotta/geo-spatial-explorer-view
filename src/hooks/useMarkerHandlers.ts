
import { toast } from 'sonner';
import { DrawingData, saveDrawing } from '@/utils/drawing-utils';
import L from 'leaflet';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export function useMarkerHandlers(mapState: any) {
  const { currentUser } = useAuth();
  
  const handleMapClick = useCallback((latlng: L.LatLng) => {
    console.log('useMarkerHandlers: handleMapClick called with:', latlng);
    console.log('useMarkerHandlers: Current activeTool:', mapState.activeTool);
    console.log('useMarkerHandlers: Current tempMarker:', mapState.tempMarker);
    
    // Only create markers when explicitly in marker mode or no tool is active and no temp marker exists
    if (mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) {
      const exactPosition: [number, number] = [latlng.lat, latlng.lng];
      
      console.log('useMarkerHandlers: Creating temp marker at position:', exactPosition);
      mapState.setTempMarker(exactPosition);
      
      // Always set a default name to make it easier to save
      const defaultName = mapState.selectedLocation?.label || 'New Building';
      mapState.setMarkerName(defaultName);
      
      console.log('useMarkerHandlers: Temp marker created successfully');
    } else {
      console.log('useMarkerHandlers: Not creating marker - activeTool:', mapState.activeTool, 'tempMarker exists:', !!mapState.tempMarker);
    }
  }, [mapState]);

  const handleShapeCreated = useCallback((shape: any) => {
    console.log('handleShapeCreated called with shape type:', shape.type);
    
    // Check if this is specifically a marker creation event
    if (shape.type === 'marker') {
      console.log('Processing marker creation from shape');
      
      // Ensure position exists and is valid before accessing it
      if (shape.position && Array.isArray(shape.position) && shape.position.length >= 2) {
        const exactPosition: [number, number] = [
          shape.position[0],
          shape.position[1]
        ];
        mapState.setTempMarker(exactPosition);
        mapState.setMarkerName('New Building');
        
        console.log('Temp marker created from shape at:', exactPosition);
        
      } else if (shape.layer && shape.layer.getLatLng) {
        // Alternative: try to get position from the layer if available
        const latLng = shape.layer.getLatLng();
        mapState.setTempMarker([latLng.lat, latLng.lng]);
        mapState.setMarkerName('New Building');
        
        console.log('Temp marker created from layer at:', [latLng.lat, latLng.lng]);
        
      } else {
        console.error('Invalid marker position data:', shape);
        toast.error('Could not create marker: invalid position data');
        return;
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
      
      // DO NOT call any marker-related functions here
      // DO NOT call setTempMarker
      // DO NOT create any popup or input field
    } else {
      console.log(`Unknown shape type: ${shape.type}`);
    }
  }, [currentUser, mapState]);

  return {
    handleMapClick,
    handleShapeCreated
  };
}
