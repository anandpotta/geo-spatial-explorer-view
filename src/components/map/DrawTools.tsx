
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditControl } from "react-leaflet-draw";
import L from 'leaflet';
import { toast } from 'sonner';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  
  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
    getFeatureGroup: () => featureGroupRef.current
  }));

  const handleCreated = (e: any) => {
    try {
      const { layerType, layer } = e;
      if (layer) {
        onCreated({ type: layerType, layer });
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
        edit: {
          selectedPathOptions: {
            color: "#fe57a1",
            opacity: 0.6,
            fillOpacity: 0.3,
            dashArray: "10, 10",
            weight: 3
          }
        },
        remove: true
      }}
      // Associate feature group with the draw control
      onMounted={(drawControl) => {
        if (drawControl && featureGroupRef.current) {
          drawControl.options.edit.featureGroup = featureGroupRef.current;
        }
      }}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
