
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
  
  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
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
        edit: activeTool === 'edit' ? {
          selectedPathOptions: {
            color: "#fe57a1",
            opacity: 0.6,
            fillOpacity: 0.3,
            dashArray: "10, 10",
            weight: 3
          }
        } : false,
        remove: activeTool === 'edit',
        featureGroup: new L.FeatureGroup()
      }}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
