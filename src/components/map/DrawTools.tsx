
import { useEffect, useCallback } from 'react';
import { EditControl } from "react-leaflet-draw";
import { v4 as uuidv4 } from 'uuid';
import { saveDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import { getCoordinatesFromLayer } from '@/utils/leaflet-drawing-config';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
}

// Use forwardRef to fix the ref warning
const DrawTools = ({ onCreated, activeTool, onClearAll }: DrawToolsProps) => {
  // Instead of using refs, use event listeners to control tools
  const handleDrawingActivation = useCallback(() => {
    if (!activeTool) return;
    
    // Dispatch custom event to activate drawing tools
    const event = new CustomEvent('activateDrawingTool', { 
      detail: { tool: activeTool } 
    });
    window.dispatchEvent(event);
    
    // Show appropriate toast message
    const toolMessages = {
      polygon: "Click on map to start drawing polygon",
      marker: "Click on map to place marker",
      circle: "Click on map to draw circle",
      rectangle: "Click on map to draw rectangle"
    };
    
    toast.info(toolMessages[activeTool as keyof typeof toolMessages] || "Drawing mode activated");
  }, [activeTool]);

  useEffect(() => {
    handleDrawingActivation();
  }, [activeTool, handleDrawingActivation]);

  useEffect(() => {
    const handleClearEvent = () => {
      if (onClearAll) {
        onClearAll();
      }
    };
    
    window.addEventListener('clearAllDrawings', handleClearEvent);
    return () => {
      window.removeEventListener('clearAllDrawings', handleClearEvent);
    };
  }, [onClearAll]);

  const handleCreated = (e: any) => {
    const { layerType, layer } = e;
    const id = uuidv4();
    
    if (layerType === 'marker' && 'getLatLng' in layer) {
      const markerLayer = layer as L.Marker;
      const { lat, lng } = markerLayer.getLatLng();
      onCreated({ type: 'marker', position: [lat, lng], id });
      return;
    }

    const layerWithOptions = layer as L.Path;
    const options = layerWithOptions.options || {};
    
    layer.drawingId = id;
    
    const drawingData = {
      id,
      type: layerType,
      coordinates: getCoordinatesFromLayer(layer, layerType),
      geoJSON: layer.toGeoJSON(),
      options: {
        color: options.color,
        weight: options.weight,
        opacity: options.opacity,
        fillOpacity: options.fillOpacity
      },
      properties: {
        name: `New ${layerType}`,
        color: options.color || '#3388ff',
        createdAt: new Date()
      }
    };
    
    saveDrawing(drawingData);
    toast.success(`${layerType} created successfully`);
    onCreated({ type: layerType, layer, geoJSON: layer.toGeoJSON(), id });
  };

  return (
    <EditControl
      position="topright"
      onCreated={handleCreated}
      draw={{
        rectangle: true,
        polygon: true,
        circle: true,
        circlemarker: false,
        marker: true,
        polyline: false
      }}
    />
  );
};

export default DrawTools;
