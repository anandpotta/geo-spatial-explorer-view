
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
          try {
            const { layerType, layer } = e;
            const id = uuidv4();
            
            if ('setStyle' in layer) {
              layer.setStyle({
                color: '#1EAEDB',
                weight: 3,
                opacity: 1,
                fillColor: '#D3E4FD',
                fillOpacity: 0.5
              });
            }

            const options = (layer as any).options || {};
            options.id = id;
            options.isDrawn = true;
            options.buildingId = id;

            setDrawnLayers(prev => ({
              ...prev,
              [id]: layer
            }));

            const geoJSON = layer.toGeoJSON();
            console.log('Created shape:', layerType, geoJSON);
            toast.success(`${layerType} created successfully`);
            onCreated({ type: layerType, layer, geoJSON, id });
          } catch (error) {
            console.error('Error creating shape:', error);
            toast.error('Failed to create shape');
          }
        }}
        draw={getDrawingOptions(activeTool)}
        edit={editOptions}
      />
    </FeatureGroup>
  );
};

export default DrawingControls;
