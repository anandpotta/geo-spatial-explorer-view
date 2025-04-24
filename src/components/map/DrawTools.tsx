
import { useEffect, useCallback, useRef } from 'react';
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

// Track if we're in a cleared state to prevent old drawings from reappearing
const DrawTools = ({ onCreated, activeTool, onClearAll }: DrawToolsProps) => {
  const wasRecentlyCleared = useRef(false);
  const editControlRef = useRef<any>(null);
  
  // Handle drawing tool activation based on active tool
  useEffect(() => {
    if (!activeTool) return;
    
    // Activate the appropriate drawing tool
    const handleDrawingActivation = () => {
      if (editControlRef.current && editControlRef.current._toolbars && editControlRef.current._toolbars.draw) {
        console.log('Activating drawing tool:', activeTool);
        
        // First, disable all drawing handlers
        Object.keys(editControlRef.current._toolbars.draw._modes).forEach(mode => {
          try {
            const handler = editControlRef.current._toolbars.draw._modes[mode].handler;
            if (handler && handler.disable) {
              handler.disable();
            }
          } catch (err) {
            console.error('Error disabling drawing handler:', err);
          }
        });
        
        // Then enable only the selected tool
        try {
          // Map the tool name to the corresponding Leaflet Draw tool name
          const toolMap: Record<string, string> = {
            'polygon': 'polygon',
            'marker': 'marker',
            'circle': 'circle',
            'rectangle': 'rectangle'
          };
          
          const leafletTool = toolMap[activeTool];
          
          if (leafletTool && editControlRef.current._toolbars.draw._modes[leafletTool]) {
            const handler = editControlRef.current._toolbars.draw._modes[leafletTool].handler;
            if (handler && handler.enable) {
              handler.enable();
            }
          }
        } catch (err) {
          console.error('Error enabling drawing tool:', err);
        }
      }
    };
    
    // Add a small delay to ensure the EditControl is fully initialized
    const timer = setTimeout(handleDrawingActivation, 100);
    
    // Show appropriate toast message
    const toolMessages = {
      polygon: "Click on map to start drawing polygon",
      marker: "Click on map to place marker",
      circle: "Click on map to draw circle",
      rectangle: "Click on map to draw rectangle"
    };
    
    toast.info(toolMessages[activeTool as keyof typeof toolMessages] || "Drawing mode activated");
    
    return () => clearTimeout(timer);
  }, [activeTool]);

  useEffect(() => {
    const handleClearEvent = () => {
      console.log('DrawTools detected clear event');
      wasRecentlyCleared.current = true;
      
      // Reset the flag after a longer delay to allow new drawings
      setTimeout(() => {
        wasRecentlyCleared.current = false;
      }, 1000);
      
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
    
    // Skip saving if we recently cleared all drawings
    if (wasRecentlyCleared.current) {
      console.log('Skipping save because drawings were recently cleared');
      return;
    }
    
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

  // Reference to get access to the EditControl instance
  const handleEditControlMount = (editControlInstance: any) => {
    editControlRef.current = editControlInstance;
  };

  return (
    <EditControl
      position="topright"
      onCreated={handleCreated}
      onMounted={handleEditControlMount}
      draw={{
        rectangle: activeTool === 'rectangle',
        polygon: activeTool === 'polygon',
        circle: activeTool === 'circle',
        circlemarker: false,
        marker: activeTool === 'marker',
        polyline: false
      }}
    />
  );
};

export default DrawTools;
