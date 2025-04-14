
import { useEffect, useRef } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import L from 'leaflet';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool?: string | null;
}

const DrawingControls = ({ onCreated, activeTool }: DrawingControlsProps) => {
  const editControlRef = useRef<any>(null);
  
  // If we want to react to activeTool changes in the future
  useEffect(() => {
    if (activeTool && editControlRef.current) {
      console.log('Active drawing tool:', activeTool);
      // We could trigger drawing modes based on activeTool here if needed
    }
  }, [activeTool]);
  
  return (
    <FeatureGroup>
      <EditControl
        ref={editControlRef}
        position="topleft"
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
