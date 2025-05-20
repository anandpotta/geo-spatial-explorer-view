
import { toast } from 'sonner';
import { DrawingData, saveDrawing } from '@/utils/drawing-utils';
import L from 'leaflet';
import { useAuth } from '@/contexts/AuthContext';
import { useRef, useEffect } from 'react';

export function useMarkerHandlers(mapState: any) {
  const { currentUser } = useAuth();
  const isAddingMarkerRef = useRef(false);
  
  // Make sure markers get draggable class
  useEffect(() => {
    const makeMarkersDraggable = () => {
      const markerElements = document.querySelectorAll('.leaflet-marker-icon:not(.leaflet-marker-draggable)');
      markerElements.forEach(marker => {
        marker.classList.add('leaflet-marker-draggable');
      });
    };
    
    // Run once on mount
    makeMarkersDraggable();
    
    // Set up interval to check for new markers
    const interval = setInterval(makeMarkersDraggable, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleMapClick = (latlng: L.LatLng) => {
    if ((mapState.activeTool === 'marker' || (!mapState.activeTool && !mapState.tempMarker)) && !isAddingMarkerRef.current) {
      // Set flag to prevent multiple markers being added simultaneously
      isAddingMarkerRef.current = true;
      
      const exactPosition: [number, number] = [latlng.lat, latlng.lng];
      console.log("Setting marker at position:", exactPosition);
      mapState.setTempMarker(exactPosition);
      
      // Always set a default name to make it easier to save
      const defaultName = mapState.selectedLocation?.label || 'New Building';
      mapState.setMarkerName(defaultName);
      
      // Dispatch marker placed event
      window.dispatchEvent(new CustomEvent('markerPlaced'));
      
      // Prevent automatic navigation by setting stayAtCurrentPosition flag
      mapState.setStayAtCurrentPosition(true);
      
      // Make sure to focus on the marker name input field after a short delay
      setTimeout(() => {
        const inputField = document.querySelector('.leaflet-popup input');
        if (inputField) {
          (inputField as HTMLElement).focus();
        }
        
        // Make sure the marker is draggable
        const markerElement = document.querySelector('.leaflet-marker-icon:not(.leaflet-marker-draggable)');
        if (markerElement) {
          markerElement.classList.add('leaflet-marker-draggable');
        }
        
        // Reset the flag after a delay
        setTimeout(() => {
          isAddingMarkerRef.current = false;
        }, 300);
      }, 100);
    }
  };

  const handleShapeCreated = (shape: any) => {
    // Prevent duplicate processing
    if (isAddingMarkerRef.current) return;
    isAddingMarkerRef.current = true;
    
    // Set the flag to prevent automatic navigation
    mapState.setStayAtCurrentPosition(true);
    
    // Dispatch drawing start event
    window.dispatchEvent(new CustomEvent('drawingStart'));
    
    if (shape.type === 'marker') {
      // Make sure the marker is draggable if it's a leaflet-draw marker
      if (shape.layer && shape.layer instanceof L.Marker) {
        shape.layer.options.draggable = true;
        if (shape.layer.dragging) {
          shape.layer.dragging.enable();
        }
        
        // Add CSS class to make it visually draggable
        if (shape.layer._icon) {
          shape.layer._icon.classList.add('leaflet-marker-draggable');
        }
      }
      
      // Ensure position exists and is valid before accessing it
      if (shape.position && Array.isArray(shape.position) && shape.position.length >= 2) {
        const exactPosition: [number, number] = [
          shape.position[0],
          shape.position[1]
        ];
        console.log("Setting marker from shape at position:", exactPosition);
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
        console.log("Setting marker from layer at position:", [latLng.lat, latLng.lng]);
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
        isAddingMarkerRef.current = false;
        return;
      }
    } else {
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
      
      toast.success(`${shape.type} created - Click to tag this building or upload a file`);
    }
    
    // Reset the flag after a delay to prevent duplicate processing
    setTimeout(() => {
      isAddingMarkerRef.current = false;
    }, 500);
  };

  return {
    handleMapClick,
    handleShapeCreated
  };
}
