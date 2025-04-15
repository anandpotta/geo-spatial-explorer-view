
import { useRef } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { v4 as uuidv4 } from 'uuid';
import L from 'leaflet';
import { useDrawingControls } from '@/hooks/useDrawingControls';
import { useLayerStyles } from '@/hooks/useLayerStyles';
import { getDrawingOptions, editOptions } from '@/config/drawingOptions';
import { toast } from 'sonner';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool?: string | null;
  selectedBuildingId?: string | null;
}

const DrawingControls = ({ onCreated, activeTool, selectedBuildingId }: DrawingControlsProps) => {
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const { drawControl, drawnLayers, setDrawnLayers, editControlRef } = useDrawingControls(activeTool);
  
  useLayerStyles(selectedBuildingId, drawnLayers);
  
  return (
    <FeatureGroup ref={featureGroupRef}>
      <EditControl
        ref={editControlRef}
        position="topleft"
        onCreated={e => {
          const { layerType, layer } = e;
          const id = uuidv4();
          
          if (layerType !== 'marker') {
            const layerWithOptions = layer as L.Path;
            
            if (!layerWithOptions.options) {
              (layerWithOptions as any).options = {};
            }
            
            if ('setStyle' in layer) {
              layer.setStyle({
                color: '#1EAEDB',
                weight: 3,
                opacity: 1,
                fillColor: '#D3E4FD',
                fillOpacity: 0.5,
                dashArray: '5, 10'
              });
            }
            
            const options = layerWithOptions.options || {};
            (options as any).id = id;
            (options as any).isDrawn = true;
            (options as any).buildingId = id;
            
            setDrawnLayers(prev => ({
              ...prev,
              [id]: layer
            }));
            
            const geoJSON = layer.toGeoJSON();
            
            toast.success(`${layerType} created successfully`);
            console.log('Created shape:', layerType, layer);
            
            onCreated({ 
              type: layerType, 
              layer,
              geoJSON,
              id
            });
          }
        }}
        draw={getDrawingOptions(activeTool)}
        edit={editOptions}
      />
    </FeatureGroup>
  );
};

export default DrawingControls;
