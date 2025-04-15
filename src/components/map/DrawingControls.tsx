import { useEffect, useCallback, useState } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import L from 'leaflet';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool?: string | null;
  selectedBuildingId?: string | null;
}

const DrawingControls = ({ onCreated, activeTool, selectedBuildingId }: DrawingControlsProps) => {
  const [drawControl, setDrawControl] = useState<any>(null);
  const [drawnLayers, setDrawnLayers] = useState<Record<string, L.Layer>>({});
  
  const editControlRef = useCallback((element: any) => {
    if (element) {
      console.log('EditControl ref received:', element);
      setDrawControl(element);
    }
  }, []);

  useEffect(() => {
    if (activeTool && drawControl) {
      console.log('Active drawing tool:', activeTool);
      
      if (drawControl._toolbars && drawControl._toolbars.draw) {
        const toolbar = drawControl._toolbars.draw;
        
        if (activeTool === 'polygon' || activeTool === 'rectangle' || activeTool === 'circle') {
          toolbar._modes.marker?.handler?.disable();
        }
        
        switch (activeTool) {
          case 'polygon':
            toolbar._modes.polygon.handler.enable();
            break;
          case 'rectangle':
            toolbar._modes.rectangle.handler.enable();
            break;
          case 'circle':
            toolbar._modes.circle.handler.enable();
            break;
          case 'marker':
            toolbar._modes.marker.handler.enable();
            break;
        }
      }
    }
  }, [activeTool, drawControl]);

  useEffect(() => {
    if (selectedBuildingId) {
      Object.entries(drawnLayers).forEach(([id, layer]) => {
        if ('setStyle' in layer) {
          const pathLayer = layer as L.Path;
          pathLayer.setStyle({
            color: '#1EAEDB',
            weight: 3,
            opacity: 0.8,
            fillColor: '#D3E4FD',
            fillOpacity: 0.5
          });
        }
      });
      
      if (drawnLayers[selectedBuildingId] && 'setStyle' in drawnLayers[selectedBuildingId]) {
        const selectedLayer = drawnLayers[selectedBuildingId] as L.Path;
        selectedLayer.setStyle({
          color: '#FFA500',
          weight: 4,
          opacity: 1,
          fillColor: '#FFD700',
          fillOpacity: 0.7
        });
        
        if ('bringToFront' in selectedLayer) {
          selectedLayer.bringToFront();
        }
        
        toast.info("Selected building highlighted on map");
      }
    }
  }, [selectedBuildingId, drawnLayers]);
  
  return (
    <FeatureGroup>
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
        draw={{
          rectangle: {
            shapeOptions: {
              color: '#1EAEDB',
              weight: 3,
              opacity: 1,
              fillColor: '#D3E4FD',
              fillOpacity: 0.5,
              dashArray: '5, 10'
            }
          },
          polygon: {
            shapeOptions: {
              color: '#1EAEDB',
              weight: 3,
              opacity: 1,
              fillColor: '#D3E4FD',
              fillOpacity: 0.5,
              dashArray: '5, 10'
            },
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: '<strong>Drawing error:</strong> Shapes cannot intersect!'
            },
            showArea: true
          },
          circle: {
            shapeOptions: {
              color: '#1EAEDB',
              weight: 3,
              opacity: 1,
              fillColor: '#D3E4FD',
              fillOpacity: 0.5,
              dashArray: '5, 10'
            },
            showRadius: true
          },
          polyline: {
            shapeOptions: {
              color: '#1EAEDB',
              weight: 3,
              opacity: 1,
              dashArray: '5, 10'
            },
            metric: true,
            feet: false,
            showLength: true
          },
          circlemarker: false,
          marker: activeTool === 'marker',
          circle: true,
          polygon: true,
          rectangle: true,
          polyline: true
        }}
        edit={{
          featureGroup: new L.FeatureGroup(),
          remove: true,
          edit: {
            selectedPathOptions: {
              maintainColor: true,
              dashArray: '5, 10'
            }
          }
        }}
      />
    </FeatureGroup>
  );
};

export default DrawingControls;
