
import { useEffect } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import L from 'leaflet';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
}

const DrawingControls = ({ onCreated }: DrawingControlsProps) => {
  return (
    <FeatureGroup>
      <EditControl
        position="topright"
        onCreated={e => {
          const { layerType, layer } = e;
          
          // Create a unique ID for any layer
          const id = uuidv4();
          
          if (layerType === 'marker' && 'getLatLng' in layer) {
            // Handle marker specifically since it has getLatLng
            const { lat, lng } = layer.getLatLng();
            onCreated({ type: 'marker', position: [lat, lng] });
          } else {
            // For other shape types (polygon, circle, rectangle, etc.)
            // We need to use type assertion since TypeScript doesn't know these properties
            (layer as any).options = (layer as any).options || {};
            (layer as any).options.id = id;
            (layer as any).options.isDrawn = true;
            
            const geoJSON = layer.toGeoJSON();
            console.log('GeoJSON:', geoJSON);
            
            toast.success(`${layerType} created successfully`);
            onCreated({ type: layerType, layer, geoJSON });
          }
        }}
        draw={{
          rectangle: true,
          polygon: true,
          circle: true,
          circlemarker: false,
          marker: true,
          polyline: true
        }}
      />
    </FeatureGroup>
  );
};

export default DrawingControls;
