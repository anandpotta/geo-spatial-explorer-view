
import { useEffect, useRef } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import L from 'leaflet';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
}

const DrawingControls = ({ onCreated, activeTool }: DrawingControlsProps) => {
  const editControlRef = useRef<any>(null);
  
  // Trigger the drawing tool when activeTool changes
  useEffect(() => {
    if (!editControlRef.current || !activeTool) return;
    
    const leafletElement = editControlRef.current.leafletElement;
    if (!leafletElement) return;
    
    // Deactivate any active draw handlers first
    Object.keys(leafletElement._modes).forEach((mode) => {
      if (leafletElement._modes[mode].handler.enabled()) {
        leafletElement._modes[mode].handler.disable();
      }
    });

    // Enable the selected draw handler
    if (activeTool === 'polygon' && leafletElement._modes.polygon) {
      leafletElement._modes.polygon.handler.enable();
      toast.info("Click on map to start drawing polygon");
    } else if (activeTool === 'marker' && leafletElement._modes.marker) {
      leafletElement._modes.marker.handler.enable();
      toast.info("Click on map to place marker");
    } else if (activeTool === 'circle' && leafletElement._modes.circle) {
      leafletElement._modes.circle.handler.enable();
      toast.info("Click on map to draw circle");
    } else if (activeTool === 'rectangle' && leafletElement._modes.rectangle) {
      leafletElement._modes.rectangle.handler.enable();
      toast.info("Click on map to draw rectangle");
    }
  }, [activeTool]);

  return (
    <FeatureGroup>
      <EditControl
        ref={editControlRef}
        position="topright"
        onCreated={e => {
          const { layerType, layer } = e;
          
          // Create a unique ID for any layer
          const id = uuidv4();
          
          // Handle marker specifically
          if (layerType === 'marker' && 'getLatLng' in layer) {
            const { lat, lng } = (layer as L.Marker).getLatLng();
            onCreated({ type: 'marker', position: [lat, lng], id });
          } else {
            // For other shape types (polygon, circle, rectangle, etc.)
            const layerWithOptions = layer as L.Path;
            if (!layerWithOptions.options) {
              layerWithOptions.options = {};
            }
            
            // Add custom properties
            layerWithOptions.options.id = id;
            layerWithOptions.options.isDrawn = true;
            
            const geoJSON = layer.toGeoJSON();
            console.log('GeoJSON:', geoJSON);
            
            toast.success(`${layerType} created successfully`);
            onCreated({ 
              type: layerType, 
              layer, 
              geoJSON,
              id
            });
          }
        }}
        draw={{
          rectangle: true,
          polygon: true,
          circle: true,
          circlemarker: false,
          marker: true,
          polyline: false // Disable polyline since we're focusing on areas
        }}
      />
    </FeatureGroup>
  );
};

export default DrawingControls;
