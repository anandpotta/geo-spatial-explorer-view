
import { useEffect, useRef } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import L from 'leaflet';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
}

const DrawingControls = ({ onCreated }: DrawingControlsProps) => {
  const editControlRef = useRef<any>(null);
  
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
