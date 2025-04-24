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
  
  useEffect(() => {
    if (!editControlRef.current || !activeTool) return;
    
    const leafletElement = editControlRef.current.leafletElement;
    if (!leafletElement) return;
    
    Object.keys(leafletElement._modes).forEach((mode) => {
      if (leafletElement._modes[mode].handler.enabled()) {
        leafletElement._modes[mode].handler.disable();
      }
    });

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
          
          const id = uuidv4();
          
          if (layerType === 'marker' && 'getLatLng' in layer) {
            const markerLayer = layer as L.Marker;
            const { lat, lng } = markerLayer.getLatLng();
            onCreated({ type: 'marker', position: [lat, lng], id });
          } else {
            const layerWithOptions = layer as L.Path;
            const options = layerWithOptions.options || {};
            
            (options as any).id = id;
            (options as any).isDrawn = true;
            
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
          polyline: false
        }}
      />
    </FeatureGroup>
  );
};

export default DrawingControls;
