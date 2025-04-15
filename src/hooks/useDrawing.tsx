
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { DrawingData, saveDrawing, getSavedDrawings, deleteDrawing } from '@/utils/geo-utils';

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

    const id = shape.id || uuidv4();
    const newDrawing = {
      id,
      type: shape.type,
      geoJSON: shape.geoJSON,
      layer: shape.layer,
      name: drawingName || `New ${shape.type}`
    };

    setCurrentDrawing(newDrawing);
    setDrawingName(newDrawing.name);
    setShowDrawingDialog(true);
  }, [drawingName]);

  const handleSaveDrawing = useCallback(() => {
    if (!currentDrawing || !drawingName.trim()) return;

    const drawingData: DrawingData = {
      id: currentDrawing.id,
      type: currentDrawing.type,
      coordinates: currentDrawing.geoJSON.coordinates,
      properties: {
        name: drawingName,
        createdAt: new Date()
      }
    };

    saveDrawing(drawingData);

    if (currentDrawing.layer) {
      setDrawnLayers(prev => ({
        ...prev,
        [drawingData.id]: currentDrawing.layer
      }));
    }

    setCurrentDrawing(null);
    setDrawingName('');
    setShowDrawingDialog(false);
    toast.success("Drawing saved successfully");
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
