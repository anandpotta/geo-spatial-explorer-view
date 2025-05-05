import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { EditControl } from "react-leaflet-draw";
import { v4 as uuidv4 } from 'uuid';
import { saveDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import { getCoordinatesFromLayer, extractSvgPathData } from '@/utils/leaflet-drawing-config';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  
  // Expose the editControlRef to parent components
  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
  }));

  // Clean up function to safely disable any active drawing handlers
  const safelyDisableTools = () => {
    if (!editControlRef.current || !editControlRef.current.leafletElement) return;
    
    try {
      const leafletElement = editControlRef.current.leafletElement;
      
      // Check if _modes exists before attempting to disable tools
      if (!leafletElement._modes) {
        console.log('No drawing modes available to disable');
        return;
      }
      
      // Safely attempt to disable each tool
      Object.keys(leafletElement._modes).forEach((mode) => {
        try {
          const handler = leafletElement._modes[mode].handler;
          
          if (handler && 
              typeof handler.enabled === 'function' && 
              handler.enabled() && 
              typeof handler.disable === 'function') {
            console.log(`Disabling ${mode} tool`);
            handler.disable();
          }
        } catch (err) {
          console.warn(`Error disabling ${mode} tool:`, err);
        }
      });
    } catch (err) {
      console.warn('Error accessing leaflet element:', err);
    }
  };

  // Handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      safelyDisableTools();
    };
  }, []);

  // Handle active tool changes
  useEffect(() => {
    if (!editControlRef.current || !editControlRef.current.leafletElement) return;
    
    try {
      const leafletElement = editControlRef.current.leafletElement;
      
      // First disable any active tools
      safelyDisableTools();
      
      // Early return if no active tool or modes aren't available
      if (!activeTool || !leafletElement._modes) {
        setIsDrawingEnabled(false);
        return;
      }
      
      const toolMessages = {
        polygon: "Click on map to start drawing polygon",
        marker: "Click on map to place marker",
        circle: "Click on map to draw circle",
        rectangle: "Click on map to draw rectangle",
        edit: "Click on a shape to edit it"
      };

      // Safely enable the requested tool if it exists
      if (leafletElement._modes[activeTool] && 
          leafletElement._modes[activeTool].handler &&
          typeof leafletElement._modes[activeTool].handler.enable === 'function') {
        try {
          console.log(`Enabling ${activeTool} tool`);
          leafletElement._modes[activeTool].handler.enable();
          setIsDrawingEnabled(true);
          
          toast.info(toolMessages[activeTool as keyof typeof toolMessages] || "Drawing mode activated");
        } catch (err) {
          console.warn(`Error enabling ${activeTool} tool:`, err);
          toast.error(`Could not activate ${activeTool} tool`);
          setIsDrawingEnabled(false);
        }
      } else {
        console.warn(`Tool ${activeTool} not found or cannot be enabled`);
        setIsDrawingEnabled(false);
      }
    } catch (err) {
      console.error('Error updating active drawing tool:', err);
      setIsDrawingEnabled(false);
    }
  }, [activeTool]);

  const handleCreated = (e: any) => {
    const { layerType, layer } = e;
    const id = `${Date.now().toString(36)}-${uuidv4()}`;
    
    try {
      if (layerType === 'marker' && 'getLatLng' in layer) {
        const markerLayer = layer as L.Marker;
        const { lat, lng } = markerLayer.getLatLng();
        onCreated({ type: 'marker', position: [lat, lng], id });
        return;
      }

      // Safety check for layer
      if (!layer) {
        console.warn('Created layer is undefined');
        return;
      }

      const layerWithOptions = layer as L.Path;
      const options = layerWithOptions.options || {};
      
      // Add ID to layer for tracking
      layer.drawingId = id;
      
      // Make sure coordinates are safely extracted
      let coordinates;
      try {
        coordinates = getCoordinatesFromLayer(layer, layerType);
      } catch (err) {
        console.warn('Error getting coordinates from layer:', err);
        coordinates = [];
      }
      
      // Extract SVG path data for polygons and rectangles
      let svgPath = '';
      if ((layerType === 'polygon' || layerType === 'rectangle') && layer._path) {
        try {
          // Get the SVG path element and extract the path data
          svgPath = extractSvgPathData(layer._path);
          console.log(`Extracted SVG path: ${svgPath}`);
        } catch (err) {
          console.warn('Error extracting SVG path:', err);
        }
      }
      
      // Create the drawing data object
      const drawingData = {
        id,
        type: layerType,
        coordinates,
        svgPath, // Add SVG path data
        geoJSON: layer.toGeoJSON ? layer.toGeoJSON() : null,
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
      
      if (drawingData.geoJSON) {
        saveDrawing(drawingData);
        toast.success(`${layerType} created successfully`);
        onCreated({ 
          type: layerType, 
          layer, 
          geoJSON: drawingData.geoJSON, 
          svgPath: drawingData.svgPath, 
          id 
        });
      } else {
        toast.error(`Error creating ${layerType}`);
      }
    } catch (err) {
      console.error('Error handling created shape:', err);
      toast.error('Error creating shape');
    }
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
      edit={{
        remove: false, // Disable built-in remove button since we're using our own
        edit: {
          // Fix for selectedPathOptions - using only valid PathOptions properties
          selectedPathOptions: {
            color: "#fe57a1", // Use a distinctive color for edit mode
            opacity: 0.7,
            fillOpacity: 0.3,
            dashArray: "10, 10", // Add dashed lines to indicate edit mode
            weight: 3
          }
        }
      }}
    />
  );
});

// Set a display name for the component
DrawTools.displayName = 'DrawTools';

export default DrawTools;
