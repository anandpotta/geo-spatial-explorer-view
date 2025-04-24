
import { useEffect, useRef } from 'react';
import { EditControl } from "react-leaflet-draw";
import { v4 as uuidv4 } from 'uuid';
import { saveDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import { getCoordinatesFromLayer } from '@/utils/leaflet-drawing-config';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
}

const DrawTools = ({ onCreated, activeTool }: DrawToolsProps) => {
  const editControlRef = useRef<any>(null);

  useEffect(() => {
    if (!editControlRef.current || !activeTool) return;
    
    const leafletElement = editControlRef.current.leafletElement;
    if (!leafletElement || !leafletElement._modes) return;
    
    // Disable all active tools first
    Object.keys(leafletElement._modes).forEach((mode) => {
      if (leafletElement._modes[mode].handler && 
          leafletElement._modes[mode].handler.enabled && 
          leafletElement._modes[mode].handler.enabled()) {
        try {
          leafletElement._modes[mode].handler.disable();
        } catch (err) {
          console.warn('Error disabling drawing handler:', err);
        }
      }
    });

    const toolMessages = {
      polygon: "Click on map to start drawing polygon",
      marker: "Click on map to place marker",
      circle: "Click on map to draw circle",
      rectangle: "Click on map to draw rectangle"
    };

    // Enable the requested tool if it exists
    if (leafletElement._modes[activeTool] && leafletElement._modes[activeTool].handler) {
      try {
        leafletElement._modes[activeTool].handler.enable();
        toast.info(toolMessages[activeTool as keyof typeof toolMessages] || "Drawing mode activated");
      } catch (err) {
        console.warn('Error enabling drawing handler:', err);
      }
    }
  }, [activeTool]);

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
      ref={editControlRef}
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
