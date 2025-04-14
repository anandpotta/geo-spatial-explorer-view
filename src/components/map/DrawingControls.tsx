
import { useRef } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
}

const DrawingControls = ({ onCreated }: DrawingControlsProps) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);

  const handleCreated = (e: any) => {
    const { layerType, layer } = e;
    
    if (layerType === 'marker') {
      const { lat, lng } = layer.getLatLng();
      onCreated({ type: 'marker', position: [lat, lng] });
    } else {
      const id = uuidv4();
      layer.options.id = id;
      layer.options.isDrawn = true;
      
      const geoJSON = layer.toGeoJSON();
      console.log('GeoJSON:', geoJSON);
      
      toast.success(`${layerType} created successfully`);
    }
  };

  return (
    <FeatureGroup ref={featureGroupRef}>
      <EditControl
        position="topright"
        onCreated={handleCreated}
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
