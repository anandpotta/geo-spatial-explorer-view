
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Building, saveBuilding } from '@/utils/building-utils';
import L from 'leaflet';

export const useDrawing = () => {
  const [showDrawingDialog, setShowDrawingDialog] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<any>(null);
  const [drawingName, setDrawingName] = useState('');
  const [drawnLayers, setDrawnLayers] = useState<Record<string, L.Layer>>({});

  const handleCreatedShape = useCallback((shape: any) => {
    if (shape.type === 'marker') {
      // Handle marker separately - this should be managed by useMarkers
      return;
    }

    console.log('New shape created:', shape);
    const id = shape.id || uuidv4();
    
    // Get coordinates for location - handle different shape types
    let coords;
    
    try {
      if (shape.type === 'polyline') {
        coords = shape.geoJSON.geometry.coordinates[0];
      } else if (shape.type === 'circle') {
        // For circle, use the center point
        coords = shape.geoJSON.geometry.coordinates || [0, 0];
      } else {
        // For polygons, rectangles, etc.
        coords = shape.geoJSON.geometry.coordinates[0][0] || [0, 0];
      }
    } catch (err) {
      console.error("Error extracting coordinates:", err);
      coords = [0, 0]; // Fallback
    }
    
    const locationId = uuidv4();
    const shapeTypeName = shape.type.charAt(0).toUpperCase() + shape.type.slice(1);
    
    const newDrawing = {
      id,
      type: shape.type,
      geoJSON: shape.geoJSON,
      layer: shape.layer,
      name: drawingName || `New ${shapeTypeName}`,
      location: {
        id: locationId,
        label: drawingName || `New ${shapeTypeName}`,
        x: coords[0],
        y: coords[1]
      }
    };

    setCurrentDrawing(newDrawing);
    setDrawingName(newDrawing.name);
    setShowDrawingDialog(true);
  }, [drawingName]);

  const handleSaveDrawing = useCallback(() => {
    if (!currentDrawing || !drawingName.trim()) return;

    try {
      // Get coordinates - handle different shape types
      let coords;
      
      try {
        if (currentDrawing.type === 'polyline') {
          coords = currentDrawing.geoJSON.geometry.coordinates[0];
        } else if (currentDrawing.type === 'circle') {
          coords = currentDrawing.geoJSON.geometry.coordinates;
        } else {
          coords = currentDrawing.geoJSON.geometry.coordinates[0][0];
        }
      } catch (err) {
        console.error("Error extracting coordinates:", err);
        coords = [0, 0]; // Fallback
      }
      
      const locationId = uuidv4();
      
      // Create building object with required fields
      const buildingData: Building = {
        id: currentDrawing.id,
        name: drawingName,
        type: currentDrawing.type,
        geoJSON: currentDrawing.geoJSON,
        locationKey: `${coords[1].toFixed(4)}_${coords[0].toFixed(4)}`,
        location: {
          id: locationId,
          label: drawingName,
          x: coords[0],
          y: coords[1]
        },
        createdAt: new Date()
      };

      console.log('Saving building:', buildingData);
      saveBuilding(buildingData);

      if (currentDrawing.layer) {
        currentDrawing.layer.bindPopup(drawingName);
        setDrawnLayers(prev => ({
          ...prev,
          [buildingData.id]: currentDrawing.layer
        }));
      }

      setCurrentDrawing(null);
      setDrawingName('');
      setShowDrawingDialog(false);
      toast.success("Building saved successfully");
    } catch (error) {
      console.error("Error saving drawing:", error);
      toast.error("Failed to save building");
    }
  }, [currentDrawing, drawingName]);

  const clearDrawingLayers = useCallback(() => {
    Object.values(drawnLayers).forEach(layer => {
      if (layer) {
        layer.remove();
      }
    });
    setDrawnLayers({});
  }, [drawnLayers]);

  return {
    showDrawingDialog,
    setShowDrawingDialog,
    currentDrawing,
    setCurrentDrawing,
    drawingName,
    setDrawingName,
    handleCreatedShape,
    handleSaveDrawing,
    clearDrawingLayers,
    drawnLayers
  };
};
