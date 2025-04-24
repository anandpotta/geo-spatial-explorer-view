
import { useEffect, useRef, forwardRef } from 'react';
import { EditControl } from "react-leaflet-draw";
import { useLeafletContext } from '@react-leaflet/core';
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

// The key fix: EditControl is a class component that expects a properly forwarded ref
const DrawTools = forwardRef<any, DrawToolsProps>(({ onCreated, activeTool, onClearAll }, ref) => {
  const context = useLeafletContext();
  const hasInitialized = useRef<boolean>(false);
  const editControlRef = useRef<any>(null);

  // Check if map is ready before rendering EditControl
  useEffect(() => {
    if (!context || !context.map || !activeTool) return;
    
    const map = context.map;
    
    // Ensure map is fully initialized before proceeding
    if (!map.getContainer() || !document.contains(map.getContainer())) {
      console.warn('Map container not ready for drawing tools');
      return;
    }
    
    // Access the EditControl instance via ref
    if (!editControlRef.current || !editControlRef.current.leafletElement) {
      console.warn('EditControl not initialized yet');
      return;
    }

    const leafletElement = editControlRef.current.leafletElement;
    if (!leafletElement || !leafletElement._modes) {
      console.warn('Drawing tools not initialized');
      return;
    }

    hasInitialized.current = true;
    
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

    return () => {
      // Cleanup when tool changes or component unmounts
      if (leafletElement && leafletElement._modes && leafletElement._modes[activeTool]?.handler?.enabled?.()) {
        try {
          leafletElement._modes[activeTool].handler.disable();
        } catch (err) {
          console.warn('Error cleaning up drawing handler:', err);
        }
      }
    };
  }, [activeTool, context]);

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

  // Only render if context is ready
  if (!context || !context.map) {
    return null;
  }

  // The key fix: properly pass and handle the ref to EditControl
  return (
    <div className="leaflet-draw-container">
      <EditControl
        ref={(ecRef) => {
          editControlRef.current = ecRef;
          // Also pass the ref to the parent component if provided
          if (typeof ref === 'function') {
            ref(ecRef);
          } else if (ref) {
            ref.current = ecRef;
          }
        }}
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
    </div>
  );
});

// Add display name for debugging
DrawTools.displayName = 'DrawTools';

export default DrawTools;
